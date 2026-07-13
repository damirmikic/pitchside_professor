/**
 * Season Manager Module
 * Handles season transitions and end-of-season processing
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showAnimatedPopup, showSuccessPopup } from '../ui/notification-system.js';
import { updateUI, updateSidebarDisplays } from '../ui/ui-controller.js';
import { calculateSeasonEndRewards, generateSponsorshipOffers, calculateSeasonTicketSales, showFinancialReport, triggerFinancialTakeover } from './finance-manager.js';
import { initializeLeagueTable, generateFixtures } from './match-manager.js';
import { startPreSeason } from './preseason-manager.js';
import { setBoardExpectation } from './board-manager.js';
import { checkQualification, startChampionsCup } from './champions-cup-manager.js';
import { recordSeasonResult } from './career-manager.js';
import { rollAcademyPayoff, generateTransferListings } from './squad-manager.js';

/**
 * End the current season
 */
export function endSeason() {
    const seasonRewards = calculateSeasonEndRewards();
    const finalPosition = seasonRewards.position;
    const { currentSeason } = gameState;
    const qualified = checkQualification(finalPosition);

    // Non-qualifying seasons are fully decided now; qualifying seasons wait
    // for the Champions Cup to conclude before recording the combined result
    if (!qualified) {
        recordSeasonResult(finalPosition, null);
    }

    let endSeasonMessage = `
        <p><strong>Final Position:</strong> ${finalPosition}${getOrdinalSuffix(finalPosition)}</p>
        <p><strong>TV Revenue:</strong> $${seasonRewards.tvRevenue.toLocaleString()}</p>
    `;

    if (seasonRewards.sponsorshipBonus > 0) {
        endSeasonMessage += `<p><strong>Sponsorship Bonus:</strong> $${seasonRewards.sponsorshipBonus.toLocaleString()}</p>`;
    }

    endSeasonMessage += `<p><strong>Total Season Revenue:</strong> $${(seasonRewards.tvRevenue + seasonRewards.sponsorshipBonus).toLocaleString()}</p>`;

    if (qualified) {
        endSeasonMessage += '<p><strong>🏆 You qualified for the Champions Cup!</strong></p>';
    }

    showAnimatedPopup(`Season ${currentSeason} Complete`, endSeasonMessage, 'success', [
        {
            text: qualified ? 'Enter the Champions Cup!' : 'Continue to Next Season',
            action: () => { qualified ? startChampionsCup(finalPosition) : startNewSeason(); }
        },
        { text: 'View Financial Report', action: () => showFinancialReport() }
    ]);

    // Rare end-of-season investor takeover (5% chance)
    triggerFinancialTakeover();
}

/**
 * Start a new season
 */
export function startNewSeason() {
    const { clubData, managerData, preSeasonData } = gameState;

    gameState.currentSeason++;
    gameState.currentMatchday = 1;

    // Reset sponsorship for new offers
    clubData.sponsorship = null;
    const sponsorshipInfo = document.getElementById('sponsorship-info');
    if (sponsorshipInfo) {
        sponsorshipInfo.textContent = 'No active deals';
    }

    // Generate new sponsorship offers
    generateSponsorshipOffers();

    // Increase wages slightly
    clubData.weeklyWages = Math.floor(clubData.weeklyWages * 1.05);

    // New transfer budget
    clubData.transferBudget = 50000 + (managerData.reputation * 1000);

    // Reset league table and fixtures
    initializeLeagueTable();
    generateFixtures();

    // Set the board's expectation for the new season based on squad strength rank
    setBoardExpectation();

    // Champions Cup qualification/bracket is decided fresh each season
    gameState.resetChampionsCup();

    // The youth academy may have produced a free prospect, and the transfer
    // market refreshes with a new set of listings
    rollAcademyPayoff();
    generateTransferListings();

    // Calculate new season ticket sales
    calculateSeasonTicketSales();

    // Reset pre-season state so preparation happens every season, not just the first
    preSeasonData.daysLeft = GAME_CONSTANTS.PRESEASON_DAYS;
    preSeasonData.matchesPlayed = 0;
    preSeasonData.teamFitness = GAME_CONSTANTS.PRESEASON_INITIAL_FITNESS;
    preSeasonData.teamChemistry = GAME_CONSTANTS.PRESEASON_INITIAL_CHEMISTRY;
    preSeasonData.seasonTicketsSoldToday = 0;
    preSeasonData.scheduledMatches = [];
    preSeasonData.nextMatchDay = null;

    updateUI();
    updateSidebarDisplays();

    showSuccessPopup('New Season!', `Welcome to Season ${gameState.currentSeason}! New sponsorship offers are available.`);

    // Enter pre-season preparation before the new league campaign begins
    startPreSeason();

    // Season transitions are a major state change worth persisting immediately,
    // not just waiting for the next matchday's autosave
    gameState.autoSave();
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 * @param {number} num Number to get suffix for
 * @returns {string} Ordinal suffix
 */
function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
}

