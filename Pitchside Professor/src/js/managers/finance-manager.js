/**
 * Finance Manager Module
 * Handles all financial operations including revenue, expenses, and sponsorships
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showAnimatedPopup, showWarningPopup, showSuccessPopup } from '../ui/notification-system.js';
import { updateUI } from '../ui/ui-controller.js';
import { showNotification } from '../ui/notification-system.js';

/**
 * Initialize the financial system
 */
export function initializeFinancialSystem() {
    // Calculate initial season ticket sales
    calculateSeasonTicketSales();

    // Generate initial sponsorship offers
    generateSponsorshipOffers();
}

/**
 * Calculate and process season ticket sales
 */
export function calculateSeasonTicketSales() {
    const { fanData, clubData } = gameState;
    
    // Season ticket sales based on fan happiness and price
    const priceEffect = Math.max(0.2, 1 - (fanData.seasonTicketPrice - 50) / 200);
    const happinessEffect = fanData.happiness / 100;
    const capacityEffect = Math.min(1, clubData.stadiumCapacity / 10000);

    fanData.maxSeasonTickets = Math.floor(clubData.stadiumCapacity * 0.5 * capacityEffect);
    fanData.seasonTicketsSold = Math.floor(fanData.maxSeasonTickets * priceEffect * happinessEffect);

    clubData.seasonTicketRevenue = fanData.seasonTicketsSold * fanData.seasonTicketPrice;
    clubData.finances += clubData.seasonTicketRevenue;

    updateSeasonTicketDisplay();
}

/**
 * Update season ticket display in UI
 */
function updateSeasonTicketDisplay() {
    const { fanData } = gameState;
    const seasonTicketsInfo = document.getElementById('season-tickets-info');
    if (seasonTicketsInfo) {
        seasonTicketsInfo.textContent = `Season tickets sold: ${fanData.seasonTicketsSold.toLocaleString()}/${fanData.maxSeasonTickets.toLocaleString()}`;
    }
}

/**
 * Generate random sponsorship offers
 */
export function generateSponsorshipOffers() {
    const { clubData } = gameState;
    clubData.sponsorshipOffers = [];

    // Generate 3-4 random sponsorship offers
    const numOffers = 3 + Math.floor(Math.random() * 2);
    const sponsors = [
        { name: "TechCorp Industries", type: "Technology" },
        { name: "SportMax Equipment", type: "Sports" },
        { name: "Global Bank United", type: "Financial" },
        { name: "Energy Plus Solutions", type: "Energy" },
        { name: "Fashion Forward Brands", type: "Lifestyle" },
        { name: "Auto Drive Motors", type: "Automotive" },
        { name: "MegaFood Restaurants", type: "Food & Beverage" },
        { name: "CloudTech Solutions", type: "Software" }
    ];

    for (let i = 0; i < numOffers; i++) {
        const sponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
        const basePayment = 25000 + Math.floor(Math.random() * 100000);
        const performanceBonus = Math.floor(basePayment * (0.5 + Math.random() * 1));

        clubData.sponsorshipOffers.push({
            id: i,
            name: sponsor.name,
            type: sponsor.type,
            basePayment: basePayment,
            performanceBonus: performanceBonus,
            bonusCondition: Math.random() > 0.5 ? "league_win" : "top_3"
        });
    }
}

/**
 * Show sponsorship offers modal
 */
export function showSponsorshipOffers() {
    const { clubData } = gameState;
    
    if (clubData.sponsorship) {
        showWarningPopup('Already Sponsored', 'You already have an active sponsorship deal. Wait until next season for new offers.');
        return;
    }

    // Create a dedicated sponsorship modal
    const modal = document.createElement('div');
    modal.className = 'sponsorship-modal';
    modal.innerHTML = `
        <div class="sponsorship-modal-content">
            <div class="sponsorship-header">
                <h2>Sponsorship Offers - Season ${gameState.currentSeason}</h2>
                <button class="close-sponsorship-modal">&times;</button>
            </div>
            <div class="sponsorship-offers-list">
                ${generateSponsorshipOffersHTML()}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.close-sponsorship-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Add event listeners for accept buttons
    modal.querySelectorAll('.accept-offer-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const offerId = parseInt(e.target.dataset.offerId);
            acceptSponsorshipOffer(offerId);
            document.body.removeChild(modal);
        });
    });
}

/**
 * Generate HTML for sponsorship offers
 * @returns {string} HTML string for sponsorship offers
 */
export function generateSponsorshipOffersHTML() {
    const { clubData } = gameState;
    
    return clubData.sponsorshipOffers.map(offer => {
        const conditionText = offer.bonusCondition === "league_win" ? "Win the League" : "Finish Top 3";
        return `
            <div class="sponsorship-offer-card">
                <div class="offer-header">
                    <h3>${offer.name}</h3>
                    <span class="offer-type">${offer.type}</span>
                </div>
                <div class="offer-details">
                    <div class="offer-row">
                        <span class="label">Base Payment:</span>
                        <span class="value">$${offer.basePayment.toLocaleString()}</span>
                    </div>
                    <div class="offer-row">
                        <span class="label">Performance Bonus:</span>
                        <span class="value">$${offer.performanceBonus.toLocaleString()}</span>
                    </div>
                    <div class="offer-row">
                        <span class="label">Bonus Condition:</span>
                        <span class="value">${conditionText}</span>
                    </div>
                    <div class="offer-total">
                        <span class="label">Potential Total:</span>
                        <span class="value total-amount">$${(offer.basePayment + offer.performanceBonus).toLocaleString()}</span>
                    </div>
                </div>
                <button class="accept-offer-btn btn btn-primary" data-offer-id="${offer.id}">
                    Accept Offer
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Accept a sponsorship offer
 * @param {number} offerId Offer ID to accept
 */
export function acceptSponsorshipOffer(offerId) {
    const { clubData } = gameState;
    const offer = clubData.sponsorshipOffers.find(o => o.id === offerId);
    
    if (offer) {
        clubData.sponsorship = offer;
        clubData.finances += offer.basePayment;

        const sponsorshipInfo = document.getElementById('sponsorship-info');
        if (sponsorshipInfo) {
            sponsorshipInfo.textContent = `${offer.name} - $${offer.basePayment.toLocaleString()} + bonuses`;
        }

        updateUI();
        showSuccessPopup('Sponsorship Signed!',
            `You've signed with ${offer.name} for $${offer.basePayment.toLocaleString()} plus performance bonuses!`);
    }
}

/**
 * Process weekly wages (charged once per matchday, since a matchday represents a game week)
 */
export function processWeeklyWages() {
    const { clubData, financialHistory, currentSeason, currentMatchday } = gameState;

    clubData.finances -= clubData.weeklyWages;
    financialHistory.weeklyExpenses.push({
        season: currentSeason,
        matchday: currentMatchday,
        amount: clubData.weeklyWages,
        type: 'wages'
    });

    showNotification('Weekly Wages', `$${clubData.weeklyWages.toLocaleString()} paid in player wages`, 'warning');
    updateUI();
}

/**
 * Calculate matchday revenue
 * @returns {Object} Revenue data including attendance and total revenue
 */
export function calculateMatchdayRevenue() {
    const { clubData, fanData } = gameState;
    const attendance = Math.floor(clubData.stadiumCapacity * (0.6 + (fanData.happiness / 100) * 0.4));
    const ticketRevenue = attendance * fanData.matchdayTicketPrice;
    const concessionRevenuePerFan = GAME_CONSTANTS.CONCESSION_REVENUE_PER_FAN_BASE +
        (clubData.concessionsLevel - 1) * GAME_CONSTANTS.CONCESSION_REVENUE_PER_FAN_PER_LEVEL;
    const merchandiseRevenuePerFan = GAME_CONSTANTS.MERCHANDISE_REVENUE_PER_FAN_BASE +
        (clubData.storeLevel - 1) * GAME_CONSTANTS.MERCHANDISE_REVENUE_PER_FAN_PER_LEVEL;
    const concessionRevenue = attendance * concessionRevenuePerFan;
    const merchandiseRevenue = attendance * merchandiseRevenuePerFan;

    clubData.matchdayRevenue = ticketRevenue + concessionRevenue + merchandiseRevenue;
    clubData.finances += clubData.matchdayRevenue;

    return {
        attendance: attendance,
        revenue: clubData.matchdayRevenue
    };
}

/**
 * Calculate season end financial rewards
 * @returns {Object} Reward details including TV revenue and bonuses
 */
export function calculateSeasonEndRewards() {
    const { clubData, leagueTable, selectedTeam } = gameState;
    
    // TV Revenue based on league position
    const position = leagueTable.findIndex(team => team.name === selectedTeam) + 1;
    const totalTeams = leagueTable.length;

    // Higher positions get more TV money
    const baseTvRevenue = 50000;
    clubData.tvRevenue = baseTvRevenue + ((totalTeams - position) * 10000);
    clubData.finances += clubData.tvRevenue;

    // Sponsorship performance bonus
    let sponsorshipBonus = 0;
    if (clubData.sponsorship) {
        const wonLeague = position === 1;
        const topThree = position <= 3;

        if ((clubData.sponsorship.bonusCondition === "league_win" && wonLeague) ||
            (clubData.sponsorship.bonusCondition === "top_3" && topThree)) {
            sponsorshipBonus = clubData.sponsorship.performanceBonus;
            clubData.finances += sponsorshipBonus;
        }
    }

    return {
        tvRevenue: clubData.tvRevenue,
        sponsorshipBonus: sponsorshipBonus,
        position: position
    };
}

/**
 * Check for sustained financial distress. A single matchday in the red draws
 * a board warning; two consecutive matchdays in the red trigger a forced
 * asset sale that bails out the finances at the cost of team strength and
 * job security.
 */
export function checkBankruptcy() {
    const { clubData, financialHistory, managerData } = gameState;

    if (clubData.finances >= 0) {
        financialHistory.consecutiveNegativeMatchdays = 0;
        return;
    }

    financialHistory.consecutiveNegativeMatchdays++;

    if (financialHistory.consecutiveNegativeMatchdays === 1) {
        showWarningPopup('Board Concern',
            "The board is concerned about the club's mounting debt. Turn the finances around, or hard decisions will be made.");
    } else if (financialHistory.consecutiveNegativeMatchdays >= 2) {
        clubData.strength = Math.max(0, clubData.strength - GAME_CONSTANTS.BANKRUPTCY_FORCED_SALE_STRENGTH_PENALTY);
        clubData.finances += GAME_CONSTANTS.BANKRUPTCY_BAILOUT_AMOUNT;
        managerData.jobSecurity = Math.max(0, managerData.jobSecurity - GAME_CONSTANTS.BANKRUPTCY_FORCED_SALE_JOB_SECURITY_PENALTY);
        financialHistory.consecutiveNegativeMatchdays = 0;

        showWarningPopup('Forced Asset Sale!',
            'The board sold key players to cover the debt. Team strength has dropped and your job security has taken a hit.');
    }

    updateUI();
}

/**
 * Trigger a financial takeover (random event)
 * @returns {boolean} True if takeover occurred
 */
export function triggerFinancialTakeover() {
    const { clubData, managerData } = gameState;
    
    // 5% chance each season for a takeover
    if (Math.random() < 0.05) {
        const takeoverAmount = 500000 + Math.floor(Math.random() * 1000000);
        clubData.finances += takeoverAmount;
        managerData.reputation += 10;

        showSuccessPopup('Financial Takeover!',
            `A wealthy investor has taken over the club! You've received $${takeoverAmount.toLocaleString()} in new investment!`);

        updateUI();
        return true;
    }
    return false;
}

/**
 * Show financial report modal
 */
export function showFinancialReport() {
    const { clubData, currentSeason } = gameState;
    
    const report = `
        <h3>Financial Report - Season ${currentSeason}</h3>
        <div class="financial-report">
            <h4>Revenue</h4>
            <p>Season Tickets: $${clubData.seasonTicketRevenue.toLocaleString()}</p>
            <p>Matchday Revenue: $${clubData.matchdayRevenue.toLocaleString()}</p>
            <p>TV Revenue: $${clubData.tvRevenue.toLocaleString()}</p>
            <p>Sponsorship: $${clubData.sponsorship ? clubData.sponsorship.basePayment.toLocaleString() : '0'}</p>
            
            <h4>Expenses</h4>
            <p>Weekly Wages: $${clubData.weeklyWages.toLocaleString()}</p>
            <p>Transfer Budget: $${clubData.transferBudget.toLocaleString()}</p>
            
            <h4>Current Balance</h4>
            <p><strong>Club Finances: $${clubData.finances.toLocaleString()}</strong></p>
        </div>
    `;

    showAnimatedPopup('Financial Report', report, 'info');
}
