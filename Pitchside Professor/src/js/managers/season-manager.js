/**
 * Season Manager Module
 * Handles season transitions and end-of-season processing
 */

import { gameState } from '../core/state-manager.js';
import { showAnimatedPopup, showSuccessPopup } from '../ui/notification-system.js';
import { updateUI } from '../ui/ui-controller.js';
import { calculateSeasonEndRewards, generateSponsorshipOffers, calculateSeasonTicketSales, showFinancialReport } from './finance-manager.js';
import { initializeLeagueTable, generateFixtures } from './match-manager.js';

/**
 * End the current season
 */
export function endSeason() {
    const seasonRewards = calculateSeasonEndRewards();
    const finalPosition = seasonRewards.position;
    const { currentSeason } = gameState;

    let endSeasonMessage = `
        <h3>Season \${currentSeason} Complete!</h3>
        <p><strong>Final Position:</strong> \${finalPosition}\${getOrdinalSuffix(finalPosition)}</p>
        <p><strong>TV Revenue:</strong> $\${seasonRewards.tvRevenue.toLocaleString()}</p>
    `;

    if (seasonRewards.sponsorshipBonus > 0) {
        endSeasonMessage += `<p><strong>Sponsorship Bonus:</strong> $\${seasonRewards.sponsorshipBonus.toLocaleString()}</p>`;
    }

    endSeasonMessage += `<p><strong>Total Season Revenue:</strong> $\${(seasonRewards.tvRevenue + seasonRewards.sponsorshipBonus).toLocaleString()}</p>`;

    showAnimatedPopup('Season Complete', endSeasonMessage, 'success', [
        { text: 'Continue to Next Season', action: () => { startNewSeason(); closePopup(); } },
        { text: 'View Financial Report', action: () => showFinancialReport() }
    ]);
}

/**
 * Start a new season
 */
export function startNewSeason() {
    const { clubData, managerData } = gameState;
    
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

    // Calculate new season ticket sales
    calculateSeasonTicketSales();

    updateUI();

    showSuccessPopup('New Season!', `Welcome to Season \${gameState.currentSeason}! New sponsorship offers are available.`);
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

/**
 * Close popup helper
 */
function closePopup() {
    const popups = document.querySelectorAll('.animated-popup');
    popups.forEach(popup => {
        if (popup.parentNode) {
            document.body.removeChild(popup);
        }
    });
}
