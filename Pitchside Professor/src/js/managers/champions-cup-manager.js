/**
 * Champions Cup Manager Module
 * Handles the cross-league knockout tournament for top-2 league finishers:
 * qualification, bracket generation, round simulation, and rewards.
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showAnimatedPopup } from '../ui/notification-system.js';
import { updateUI } from '../ui/ui-controller.js';
import { rollWeightedDice } from '../utils/dice.js';
import { recordSeasonResult } from './career-manager.js';

const STAGE_NAMES = GAME_CONSTANTS.CHAMPIONS_CUP_STAGE_NAMES;

const REWARD_BY_STAGE = {
    'Round of 16': GAME_CONSTANTS.CHAMPIONS_CUP_REWARD_PARTICIPANT,
    'Quarterfinal': GAME_CONSTANTS.CHAMPIONS_CUP_REWARD_QUARTERFINALIST,
    'Semifinal': GAME_CONSTANTS.CHAMPIONS_CUP_REWARD_SEMIFINALIST,
    'Final': GAME_CONSTANTS.CHAMPIONS_CUP_REWARD_FINALIST
};

/**
 * Check whether the player's final league position qualifies for the
 * Champions Cup (top 2). Called from endSeason().
 * @param {number} finalPosition
 * @returns {boolean}
 */
export function checkQualification(finalPosition) {
    const qualified = finalPosition <= GAME_CONSTANTS.CHAMPIONS_CUP_QUALIFICATION_POSITION;
    gameState.championsCup.qualified = qualified;
    return qualified;
}

/**
 * Fisher-Yates shuffle (non-mutating)
 * @param {Array} array
 * @returns {Array}
 */
function shuffled(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * The player's league sends its actual top 2 (from the just-completed table)
 * @returns {Array<Object>}
 */
function getOwnLeagueQualifiers() {
    const { leagueTable, selectedLeague } = gameState;
    return leagueTable.slice(0, GAME_CONSTANTS.CHAMPIONS_CUP_QUALIFICATION_POSITION).map(team => ({
        name: team.name,
        league: selectedLeague,
        strength: team.strength,
        isPlayer: team.isPlayer
    }));
}

/**
 * The other 7 leagues aren't simulated week-to-week, so their 2 qualifiers
 * each are chosen via a strength-weighted random pick (stronger clubs are
 * more likely to have finished top 2, but upsets can happen).
 * @returns {Array<Object>}
 */
function getOtherLeagueQualifiers() {
    const { leagues, selectedLeague } = gameState;
    const qualifiers = [];

    Object.keys(leagues).forEach(leagueName => {
        if (leagueName === selectedLeague) return;

        const ranked = leagues[leagueName]
            .map(team => ({
                name: team.name,
                league: leagueName,
                strength: team.baseStrength * 10,
                isPlayer: false,
                score: team.baseStrength + Math.random() * 4
            }))
            .sort((a, b) => b.score - a.score);

        qualifiers.push(ranked[0], ranked[1]);
    });

    return qualifiers;
}

/**
 * Build an empty tie between two qualifiers
 */
function makeTie(home, away) {
    return {
        home: home.name,
        away: away.name,
        homeLeague: home.league,
        awayLeague: away.league,
        homeStrength: home.strength,
        awayStrength: away.strength,
        isPlayerTie: home.isPlayer || away.isPlayer,
        played: false,
        homeGoals: null,
        awayGoals: null,
        wentToPenalties: false,
        winner: null
    };
}

/**
 * Start the Champions Cup: gather all 16 qualifiers (player's league top 2 +
 * 2 from each of the other 7 leagues), draw a random Round of 16, and switch
 * the UI over to the Champions Cup view.
 */
export function startChampionsCup(leaguePosition) {
    const allQualifiers = shuffled([...getOwnLeagueQualifiers(), ...getOtherLeagueQualifiers()]);

    const firstRound = [];
    for (let i = 0; i < allQualifiers.length; i += 2) {
        firstRound.push(makeTie(allQualifiers[i], allQualifiers[i + 1]));
    }

    gameState.championsCup = {
        qualified: true,
        active: true,
        won: false,
        leaguePosition,
        bracket: [firstRound],
        currentRoundIndex: 0
    };

    switchToChampionsCupView();
    renderChampionsCupUI();

    showAnimatedPopup(
        'Champions Cup Draw!',
        `${gameState.selectedTeam} have been drawn into the Round of 16. Good luck on the continental stage!`,
        'info'
    );
}

/**
 * Simulate a single knockout tie. Draws go to a penalty shootout, which is
 * a coin flip nudged slightly by relative strength.
 * @param {Object} tie
 */
function simulateTie(tie) {
    let homeGoals = rollWeightedDice();
    let awayGoals = rollWeightedDice();

    const homeBonusChance = Math.floor(tie.homeStrength / 20) / 10;
    const awayBonusChance = Math.floor(tie.awayStrength / 20) / 10;
    if (Math.random() < homeBonusChance) homeGoals = Math.min(5, homeGoals + 1);
    if (Math.random() < awayBonusChance) awayGoals = Math.min(5, awayGoals + 1);

    if (Math.random() < GAME_CONSTANTS.HOME_ADVANTAGE_CHANCE) {
        homeGoals = Math.min(5, homeGoals + 1);
    }

    tie.homeGoals = homeGoals;
    tie.awayGoals = awayGoals;
    tie.played = true;

    if (homeGoals === awayGoals) {
        tie.wentToPenalties = true;
        const strengthNudge = (tie.homeStrength - tie.awayStrength) / 400;
        const homeWinChance = Math.min(0.65, Math.max(0.35, 0.5 + strengthNudge));
        tie.winner = Math.random() < homeWinChance ? tie.home : tie.away;
    } else {
        tie.wentToPenalties = false;
        tie.winner = homeGoals > awayGoals ? tie.home : tie.away;
    }
}

/**
 * Play out every tie in the current round, advance the bracket, and either
 * progress to the next round or conclude the tournament.
 */
export function playChampionsCupRound() {
    const { championsCup, selectedTeam } = gameState;
    if (!championsCup.active) return;

    const currentRound = championsCup.bracket[championsCup.currentRoundIndex];
    currentRound.forEach(tie => {
        if (!tie.played) simulateTie(tie);
    });

    renderChampionsCupUI();

    const playerTie = currentRound.find(tie => tie.isPlayerTie);
    const playerEliminated = playerTie && playerTie.winner !== selectedTeam;

    if (playerEliminated) {
        finishChampionsCup(championsCup.currentRoundIndex);
        return;
    }

    const winners = currentRound.map(tie => ({
        name: tie.winner,
        league: tie.winner === tie.home ? tie.homeLeague : tie.awayLeague,
        strength: tie.winner === tie.home ? tie.homeStrength : tie.awayStrength,
        isPlayer: tie.winner === selectedTeam
    }));

    if (winners.length === 1) {
        championsCup.won = true;
        finishChampionsCup(championsCup.bracket.length);
        return;
    }

    const nextRound = [];
    for (let i = 0; i < winners.length; i += 2) {
        nextRound.push(makeTie(winners[i], winners[i + 1]));
    }
    championsCup.bracket.push(nextRound);
    championsCup.currentRoundIndex++;

    renderChampionsCupUI();
}

/**
 * Conclude the tournament, apply rewards, and hand off to the new season.
 * @param {number} stageIndex - Index into STAGE_NAMES of the furthest stage reached
 */
function finishChampionsCup(stageIndex) {
    const { championsCup, managerData, clubData, selectedTeam } = gameState;
    championsCup.active = false;

    let title, message, reward, type, cupResultLabel;

    if (championsCup.won) {
        reward = GAME_CONSTANTS.CHAMPIONS_CUP_REWARD_WINNER;
        title = 'Champions Cup Winners!';
        message = `${selectedTeam} are Champions of the continent! An incredible achievement for the club.`;
        type = 'success';
        cupResultLabel = 'Won';
    } else {
        const stageName = STAGE_NAMES[stageIndex] || STAGE_NAMES[0];
        reward = REWARD_BY_STAGE[stageName] || GAME_CONSTANTS.CHAMPIONS_CUP_REWARD_PARTICIPANT;
        title = 'Champions Cup Over';
        message = `${selectedTeam}'s Champions Cup run ends at the ${stageName} stage.`;
        type = 'info';
        cupResultLabel = stageName;
    }

    clubData.finances += reward.finances;
    managerData.reputation += reward.reputation;

    recordSeasonResult(championsCup.leaguePosition, cupResultLabel);
    renderChampionsCupUI();
    updateUI();

    showAnimatedPopup(
        title,
        `${message}<br><br>Reward: $${reward.finances.toLocaleString()}, +${reward.reputation} reputation.`,
        type,
        [
            {
                text: 'Continue to Next Season',
                action: () => {
                    import('./season-manager.js').then(module => module.startNewSeason());
                }
            }
        ]
    );
}

/**
 * Click the sidebar's Champions Cup link programmatically, reusing the
 * existing section-switching logic rather than duplicating it.
 */
function switchToChampionsCupView() {
    const link = document.querySelector('.sidebar-menu a[data-section="champions-cup-view"]');
    if (link) link.click();
}

/**
 * Render the current bracket state and past-round results into the
 * Champions Cup view.
 */
export function renderChampionsCupUI() {
    const { championsCup } = gameState;
    const stageNameEl = document.getElementById('champions-cup-stage-name');
    const contentEl = document.getElementById('champions-cup-content');
    const resultsEl = document.getElementById('champions-cup-results');
    const playBtn = document.getElementById('play-champions-cup-round-btn');
    if (!stageNameEl || !contentEl) return;

    if (!championsCup.bracket.length) {
        stageNameEl.textContent = '';
        contentEl.innerHTML = '<p style="text-align: center;">Finish in the top 2 of your league to qualify for the Champions Cup.</p>';
        if (resultsEl) resultsEl.innerHTML = '';
        if (playBtn) playBtn.style.display = 'none';
        return;
    }

    const roundIndex = championsCup.currentRoundIndex;
    const currentRound = championsCup.bracket[roundIndex];

    stageNameEl.textContent = championsCup.active
        ? STAGE_NAMES[roundIndex]
        : (championsCup.won ? 'Champions!' : 'Tournament Complete');

    const rows = currentRound.map(tie => {
        const scoreText = tie.played
            ? `${tie.homeGoals} - ${tie.awayGoals}${tie.wentToPenalties ? ' (pens)' : ''}`
            : 'vs';
        const rowStyle = tie.isPlayerTie ? ' style="font-weight: bold; color: var(--accent-gold);"' : '';
        return `<tr${rowStyle}><td>${tie.home}</td><td>${scoreText}</td><td>${tie.away}</td></tr>`;
    }).join('');

    contentEl.innerHTML = `
        <div id="champions-cup-groups">
            <table>
                <thead><tr><th>Home</th><th>Score</th><th>Away</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    if (resultsEl) {
        const pastRounds = championsCup.bracket.slice(0, roundIndex + (championsCup.active ? 0 : 1));
        resultsEl.innerHTML = pastRounds.map((round, idx) => {
            const results = round.map(tie =>
                `${tie.home} ${tie.homeGoals}-${tie.awayGoals} ${tie.away}${tie.wentToPenalties ? ` (${tie.winner} win on penalties)` : ''}`
            ).join('<br>');
            return `<h5>${STAGE_NAMES[idx]}</h5><p>${results}</p>`;
        }).join('');
    }

    if (playBtn) {
        playBtn.style.display = championsCup.active ? 'block' : 'none';
    }
}
