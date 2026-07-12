/**
 * Career Manager Module
 * Tracks season-by-season career history, the trophy cabinet, and achievements.
 * These records are career-long: they persist across job changes, unlike
 * everything club-specific.
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showSuccessPopup } from '../ui/notification-system.js';
import { getOrdinalSuffix } from '../utils/formatters.js';

const ACHIEVEMENTS = [
    { id: 'invincible_season', name: 'Invincible', description: 'Complete a season unbeaten.' },
    { id: 'worst_to_first', name: 'Worst to First', description: 'Finish 1st the season after finishing last.' },
    { id: 'continental_champion', name: 'Continental Champion', description: 'Win the Champions Cup.' },
    { id: 'dynasty', name: 'Dynasty', description: `Win ${GAME_CONSTANTS.DYNASTY_ACHIEVEMENT_TROPHY_COUNT} trophies (league titles + Champions Cups) across your career.` },
    { id: 'tycoon', name: 'Tycoon', description: `Reach $${GAME_CONSTANTS.TYCOON_ACHIEVEMENT_FINANCES_THRESHOLD.toLocaleString()} in club finances.` }
];

/**
 * Record the outcome of a completed season into career-long history, check
 * for newly-unlocked achievements, and refresh the career summary UI.
 * @param {number} finalPosition - League finishing position
 * @param {string|null} cupResult - Furthest Champions Cup stage reached this
 *   season ('Round of 16'|'Quarterfinal'|'Semifinal'|'Final'|'Won'), or null
 *   if the club didn't qualify.
 */
export function recordSeasonResult(finalPosition, cupResult) {
    const { currentSeason, selectedLeague, selectedTeam, leagueTable } = gameState;

    const entry = {
        season: currentSeason,
        league: selectedLeague,
        team: selectedTeam,
        finalPosition,
        leagueSize: leagueTable.length,
        leagueChampion: leagueTable[0] ? leagueTable[0].name : selectedTeam,
        wonLeague: finalPosition === 1,
        cupResult,
        wonCup: cupResult === 'Won'
    };

    gameState.careerHistory.push(entry);
    checkAchievements(entry);
    renderCareerSummary();
}

/**
 * Evaluate achievement conditions against the latest season entry and the
 * career-long record, unlocking any that are newly met.
 * @param {Object} latestEntry
 */
function checkAchievements(latestEntry) {
    const { achievements, careerHistory, clubData, leagueTable } = gameState;
    const newlyUnlocked = [];

    const unlock = (id) => {
        if (!achievements.includes(id)) {
            achievements.push(id);
            newlyUnlocked.push(id);
        }
    };

    // Invincible season: unbeaten all year (draws are fine, no losses)
    const playerRow = leagueTable.find(team => team.isPlayer);
    if (playerRow && playerRow.played > 0 && playerRow.lost === 0) {
        unlock('invincible_season');
    }

    // Worst to first: finished last, then finished first the very next season
    const previousEntry = careerHistory[careerHistory.length - 2];
    if (previousEntry && previousEntry.finalPosition === previousEntry.leagueSize && latestEntry.finalPosition === 1) {
        unlock('worst_to_first');
    }

    if (latestEntry.wonCup) {
        unlock('continental_champion');
    }

    const trophyCount = careerHistory.filter(entry => entry.wonLeague || entry.wonCup).length;
    if (trophyCount >= GAME_CONSTANTS.DYNASTY_ACHIEVEMENT_TROPHY_COUNT) {
        unlock('dynasty');
    }

    if (clubData.finances >= GAME_CONSTANTS.TYCOON_ACHIEVEMENT_FINANCES_THRESHOLD) {
        unlock('tycoon');
    }

    if (newlyUnlocked.length > 0) {
        const names = newlyUnlocked.map(id => ACHIEVEMENTS.find(a => a.id === id).name).join(', ');
        showSuccessPopup('Achievement Unlocked!', `You've earned: ${names}`);
    }
}

/**
 * Render the career summary (trophy cabinet, achievements, season-by-season
 * history) into the Past Champions tab.
 */
export function renderCareerSummary() {
    const container = document.getElementById('career-summary');
    if (!container) return;

    const { careerHistory, achievements } = gameState;

    if (careerHistory.length === 0) {
        container.innerHTML = '<p><small>Complete a season to build your career history.</small></p>';
        return;
    }

    const leagueTitles = careerHistory.filter(entry => entry.wonLeague).length;
    const cupWins = careerHistory.filter(entry => entry.wonCup).length;

    const historyRows = [...careerHistory].reverse().map(entry => `
        <tr>
            <td>${entry.season}</td>
            <td>${entry.team}</td>
            <td>${entry.league}</td>
            <td>${getOrdinalSuffix(entry.finalPosition)}${entry.wonLeague ? ' 🏆' : ''}</td>
            <td>${entry.cupResult ? (entry.cupResult === 'Won' ? 'Winners 🏆' : `Eliminated: ${entry.cupResult}`) : '—'}</td>
        </tr>
    `).join('');

    const achievementsHTML = achievements.length > 0
        ? achievements.map(id => {
            const achievement = ACHIEVEMENTS.find(a => a.id === id);
            return achievement ? `<span class="achievement-badge" title="${achievement.description}">${achievement.name}</span>` : '';
        }).join('')
        : '<p><small>No achievements unlocked yet.</small></p>';

    container.innerHTML = `
        <div class="trophy-cabinet">
            <div class="trophy-stat"><strong>${leagueTitles}</strong><span>League Titles</span></div>
            <div class="trophy-stat"><strong>${cupWins}</strong><span>Champions Cups</span></div>
            <div class="trophy-stat"><strong>${careerHistory.length}</strong><span>Seasons Managed</span></div>
        </div>
        <h5>Achievements</h5>
        <div class="achievements-list">${achievementsHTML}</div>
        <h5>Career History</h5>
        <table>
            <thead><tr><th>Season</th><th>Club</th><th>League</th><th>Position</th><th>Champions Cup</th></tr></thead>
            <tbody>${historyRows}</tbody>
        </table>
    `;
}
