/**
 * Board Manager Module
 * Handles board expectations, sacking, and the manager career (job board) flow
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showNotification } from '../ui/notification-system.js';
import { getOrdinalSuffix } from '../utils/formatters.js';

/**
 * Rank the player's club by strength among the current league table and set
 * a board expectation (target finishing position) for the season.
 */
export function setBoardExpectation() {
    const { leagueTable, selectedTeam, managerData } = gameState;
    if (!leagueTable.length) return;

    const ranked = [...leagueTable].sort((a, b) => b.strength - a.strength);
    const strengthRank = ranked.findIndex(team => team.name === selectedTeam) + 1;
    managerData.boardExpectation = Math.min(
        leagueTable.length,
        strengthRank + GAME_CONSTANTS.BOARD_EXPECTATION_SLACK
    );

    updateBoardExpectationDisplay();
}

/**
 * Update the board expectation UI text in the Manager tab
 */
function updateBoardExpectationDisplay() {
    const el = document.getElementById('board-expectation-display');
    if (!el) return;
    const { boardExpectation } = gameState.managerData;
    el.textContent = boardExpectation ? `Finish ${getOrdinalSuffix(boardExpectation)} or better` : 'Not yet set';
}

/**
 * Apply matchday-over-matchday job security drift based on current league
 * position vs. the board's expectation. Runs every matchday regardless of
 * that day's individual result, so a team coasting well below its target
 * loses job security even through the occasional win.
 */
export function applyBoardPressure() {
    const { leagueTable, selectedTeam, managerData } = gameState;
    if (!managerData.boardExpectation) return;

    const currentPosition = leagueTable.findIndex(team => team.name === selectedTeam) + 1;
    if (currentPosition === 0) return;

    const gap = currentPosition - managerData.boardExpectation;
    const wasAboveWarningLine = managerData.jobSecurity > 30;

    if (gap <= 0) {
        managerData.jobSecurity = Math.min(100, managerData.jobSecurity + GAME_CONSTANTS.BOARD_PRESSURE_POSITIVE_DRIFT);
    } else if (gap >= GAME_CONSTANTS.BOARD_PRESSURE_MISS_THRESHOLD) {
        managerData.jobSecurity = Math.max(0, managerData.jobSecurity + GAME_CONSTANTS.BOARD_PRESSURE_NEGATIVE_DRIFT);
    }

    if (wasAboveWarningLine && managerData.jobSecurity <= 30 && managerData.jobSecurity > 0) {
        showNotification(
            'Board Pressure',
            `Sitting ${getOrdinalSuffix(currentPosition)}, well below the board's expectations. Your job is under threat.`,
            'warning'
        );
    }

    updateBoardExpectationDisplay();
}

/**
 * Check whether job security has hit zero and, if so, trigger the sacking sequence.
 */
export function checkForSacking() {
    const { managerData } = gameState;
    if (gameState.isSacked) return;
    if (managerData.jobSecurity <= GAME_CONSTANTS.SACKING_JOB_SECURITY_THRESHOLD) {
        triggerSacking();
    }
}

/**
 * Fire the sacking sequence: a full-screen "you've been sacked" overlay, then
 * hand off to the job board so the player's career continues at a new club.
 */
function triggerSacking() {
    gameState.isSacked = true;
    showSackingOverlay(() => {
        showJobBoard();
    });
}

/**
 * Show the full-screen sacking overlay
 * @param {Function} callback Called once the player dismisses the overlay
 */
function showSackingOverlay(callback) {
    const { selectedTeam, currentSeason, managerData } = gameState;

    const overlay = document.createElement('div');
    overlay.className = 'sacking-overlay';
    overlay.innerHTML = `
        <div class="sacking-content">
            <picture>
                <source srcset="src/assets/images/lose cover.webp" type="image/webp">
                <img src="src/assets/images/lose cover.png" alt="Sacked" class="sacking-cover-image">
            </picture>
            <h2>You've Been Sacked!</h2>
            <p>The board at ${selectedTeam} has run out of patience and terminated your contract.</p>
            <p class="sacking-stats">Reputation: ${managerData.reputation} &middot; Seasons managed: ${currentSeason}</p>
            <button id="sacking-continue-btn" class="btn btn-primary">Check the Job Board</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#sacking-continue-btn').addEventListener('click', () => {
        document.body.removeChild(overlay);
        callback();
    });
}

/**
 * Give the strength tier of a club a human-readable label for job listings
 * @param {number} baseStrength
 * @returns {string}
 */
function strengthTierLabel(baseStrength) {
    if (baseStrength >= 9) return 'Elite';
    if (baseStrength >= 7) return 'Strong';
    if (baseStrength >= 5) return 'Average';
    return 'Modest';
}

/**
 * Build a spread of job offers: a couple of modest clubs, a couple of
 * mid-table clubs, and a couple of aspirational clubs gated by reputation.
 * The single weakest offer is always free of a reputation requirement so a
 * career can never truly dead-end.
 * @returns {Array<Object>}
 */
export function generateJobOffers() {
    const { leagues, selectedLeague, selectedTeam } = gameState;

    const allTeams = [];
    Object.keys(leagues).forEach(leagueName => {
        leagues[leagueName].forEach(team => {
            if (!(leagueName === selectedLeague && team.name === selectedTeam)) {
                allTeams.push({ league: leagueName, teamName: team.name, baseStrength: team.baseStrength });
            }
        });
    });

    const shuffled = allTeams.sort(() => Math.random() - 0.5);
    const tierCount = GAME_CONSTANTS.JOB_OFFERS_PER_TIER;
    const weak = shuffled.filter(t => t.baseStrength <= 5).slice(0, tierCount);
    const mid = shuffled.filter(t => t.baseStrength > 5 && t.baseStrength <= 8).slice(0, tierCount);
    const strong = shuffled.filter(t => t.baseStrength > 8).slice(0, tierCount);

    const offers = [...weak, ...mid, ...strong].map(team => ({
        league: team.league,
        teamName: team.teamName,
        baseStrength: team.baseStrength,
        requiredReputation: team.baseStrength * GAME_CONSTANTS.JOB_OFFER_REPUTATION_PER_STRENGTH
    }));

    // Guarantee at least one offer is always reachable, regardless of reputation
    if (offers.length > 0) {
        const weakestIndex = offers.reduce(
            (minIdx, offer, idx) => (offer.baseStrength < offers[minIdx].baseStrength ? idx : minIdx),
            0
        );
        offers[weakestIndex].requiredReputation = 0;
    }

    return offers;
}

/**
 * Show the job board page and populate it with fresh offers
 */
export function showJobBoard() {
    document.body.classList.add('job-board-active');
    const jobBoardPage = document.getElementById('page-job-board');
    if (jobBoardPage) jobBoardPage.classList.add('active');

    const reputationDisplay = document.getElementById('job-board-reputation');
    if (reputationDisplay) reputationDisplay.textContent = gameState.managerData.reputation;

    renderJobBoard(generateJobOffers());
}

/**
 * Render job offer cards into the job board listings container
 * @param {Array<Object>} offers
 */
function renderJobBoard(offers) {
    const listings = document.getElementById('job-board-listings');
    if (!listings) return;

    const { managerData } = gameState;

    listings.innerHTML = offers.map((offer, index) => {
        const canAccept = managerData.reputation >= offer.requiredReputation;
        return `
            <article class="job-offer-card ${canAccept ? '' : 'locked-offer'}">
                <div class="offer-header">
                    <h3>${offer.teamName}</h3>
                    <span class="offer-type">${strengthTierLabel(offer.baseStrength)}</span>
                </div>
                <div class="offer-details">
                    <div class="offer-row">
                        <span class="label">League:</span>
                        <span class="value">${offer.league}</span>
                    </div>
                    <div class="offer-row">
                        <span class="label">Required Reputation:</span>
                        <span class="value">${offer.requiredReputation}</span>
                    </div>
                </div>
                <button class="accept-offer-btn btn btn-primary" data-offer-index="${index}" ${canAccept ? '' : 'disabled'}>
                    ${canAccept ? 'Accept Job' : 'Reputation Too Low'}
                </button>
            </article>
        `;
    }).join('');

    listings.querySelectorAll('.accept-offer-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.offerIndex);
            acceptJobOffer(offers[index]);
        });
    });
}

/**
 * Accept a job offer: reset all club-specific state to a fresh start at the
 * new club while career stats (wealth, reputation, lifestyle) persist.
 * @param {Object} offer
 */
function acceptJobOffer(offer) {
    gameState.startNewJob(offer.league, offer.teamName);

    localStorage.setItem('selectedLeague', offer.league);
    localStorage.setItem('selectedTeam', offer.teamName);

    document.body.classList.remove('job-board-active');
    const jobBoardPage = document.getElementById('page-job-board');
    if (jobBoardPage) jobBoardPage.classList.remove('active');

    import('../main.js').then(module => {
        module.initializeGame();
        // A new job is a major state change worth persisting immediately,
        // rather than leaving the autosave pointed at the old club until
        // the first matchday at the new one
        gameState.autoSave();
    });
}
