/**
 * UI Controller
 * Handles all UI updates and rendering
 */

import { gameState } from '../core/state-manager.js';
import { getStadiumLevelName, formatCurrency, formatNumber, getOrdinalSuffix } from '../utils/formatters.js';

/**
 * Update all UI elements
 */
export function updateUI() {
    updateManagerStats();
    updateClubStats();
    updateFanStats();
    updateStadiumInfo();
    updateSeasonTicketDisplay();
    updateTicketPrices();
}

/**
 * Update manager statistics displays
 */
function updateManagerStats() {
    const wealthElement = document.getElementById('manager-wealth');
    const reputationElement = document.getElementById('manager-reputation');
    const jobSecurityBar = document.getElementById('job-security-bar');

    if (wealthElement) {
        wealthElement.textContent = formatCurrency(gameState.managerData.wealth);
    }
    if (reputationElement) {
        reputationElement.textContent = gameState.managerData.reputation;
    }

    if (jobSecurityBar) {
        jobSecurityBar.style.width = `${gameState.managerData.jobSecurity}%`;
        jobSecurityBar.textContent = `${gameState.managerData.jobSecurity}%`;

        if (gameState.managerData.jobSecurity >= 70) {
            jobSecurityBar.style.backgroundColor = 'var(--job-security-high)';
        } else if (gameState.managerData.jobSecurity >= 40) {
            jobSecurityBar.style.backgroundColor = 'var(--job-security-medium)';
        } else {
            jobSecurityBar.style.backgroundColor = 'var(--job-security-low)';
        }
    }
}

/**
 * Update club statistics displays
 */
function updateClubStats() {
    const financesElement = document.getElementById('club-finances');
    const strengthElement = document.getElementById('club-strength');

    if (financesElement) {
        financesElement.textContent = formatCurrency(gameState.clubData.finances);
    }
    if (strengthElement) {
        strengthElement.textContent = gameState.clubData.strength;
    }
}

/**
 * Update fan statistics displays
 */
function updateFanStats() {
    const fanHappinessBar = document.getElementById('fan-happiness-bar');

    if (fanHappinessBar) {
        fanHappinessBar.style.width = `${gameState.fanData.happiness}%`;
        fanHappinessBar.textContent = `${gameState.fanData.happiness}%`;

        if (gameState.fanData.happiness >= 70) {
            fanHappinessBar.style.backgroundColor = 'var(--job-security-high)';
        } else if (gameState.fanData.happiness >= 40) {
            fanHappinessBar.style.backgroundColor = 'var(--job-security-medium)';
        } else {
            fanHappinessBar.style.backgroundColor = 'var(--job-security-low)';
        }
    }
}

/**
 * Update stadium information display
 */
function updateStadiumInfo() {
    const stadiumInfoElement = document.getElementById('stadium-info');
    if (stadiumInfoElement) {
        stadiumInfoElement.textContent =
            `Current Capacity: ${formatNumber(gameState.clubData.stadiumCapacity)} | Level: ${getStadiumLevelName(gameState.clubData.stadiumLevel)}`;
    }
}

/**
 * Update season ticket display
 */
export function updateSeasonTicketDisplay() {
    const seasonTicketsInfo = document.getElementById('season-tickets-info');
    if (seasonTicketsInfo) {
        seasonTicketsInfo.textContent =
            `Season tickets sold: ${formatNumber(gameState.fanData.seasonTicketsSold)}/${formatNumber(gameState.fanData.maxSeasonTickets)}`;
    }
}

/**
 * Update ticket price displays
 */
function updateTicketPrices() {
    const seasonTicketValue = document.getElementById('season-ticket-price-value');
    const matchdayTicketValue = document.getElementById('matchday-ticket-price-value');

    if (seasonTicketValue) {
        seasonTicketValue.textContent = formatCurrency(gameState.fanData.seasonTicketPrice);
    }
    if (matchdayTicketValue) {
        matchdayTicketValue.textContent = formatCurrency(gameState.fanData.matchdayTicketPrice);
    }
}

/**
 * Update sidebar displays (wealth, reputation, season, matchday)
 */
export function updateSidebarDisplays() {
    const wealthDisplay = document.getElementById('manager-wealth-display');
    const reputationDisplay = document.getElementById('manager-reputation-display');
    const seasonDisplay = document.getElementById('season-display');
    const matchdayDisplay = document.getElementById('matchday-display');

    if (wealthDisplay) {
        wealthDisplay.textContent = formatNumber(gameState.managerData.wealth);
    }
    if (reputationDisplay) {
        reputationDisplay.textContent = gameState.managerData.reputation;
    }
    if (seasonDisplay) {
        seasonDisplay.textContent = gameState.currentSeason;
    }
    if (matchdayDisplay) {
        matchdayDisplay.textContent = gameState.currentMatchday;
    }
}

/**
 * Update all section-specific UIs
 */
export function updateAllSectionUIs() {
    // Manager section
    const managerWealthStat = document.getElementById('manager-wealth-stat');
    const managerReputationStat = document.getElementById('manager-reputation-stat');
    const managerJobSecurityStat = document.getElementById('manager-job-security-stat');

    if (managerWealthStat) managerWealthStat.textContent = formatNumber(gameState.managerData.wealth);
    if (managerReputationStat) managerReputationStat.textContent = gameState.managerData.reputation;
    if (managerJobSecurityStat) managerJobSecurityStat.textContent = gameState.managerData.jobSecurity;

    // Club section
    const clubStrengthStat = document.getElementById('club-strength-stat');
    const clubCapacityStat = document.getElementById('club-capacity-stat');
    const clubFinancesStat = document.getElementById('club-finances-stat');

    if (clubStrengthStat) clubStrengthStat.textContent = gameState.clubData.strength;
    if (clubCapacityStat) clubCapacityStat.textContent = formatNumber(gameState.clubData.stadiumCapacity);
    if (clubFinancesStat) clubFinancesStat.textContent = formatNumber(gameState.clubData.finances);

    // Fans section
    const fanHappinessStat = document.getElementById('fan-happiness-stat');
    const seasonTicketsSoldStat = document.getElementById('season-tickets-sold-stat');
    const ticketPriceStat = document.getElementById('ticket-price-stat');

    if (fanHappinessStat) fanHappinessStat.textContent = gameState.fanData.happiness;
    if (seasonTicketsSoldStat) seasonTicketsSoldStat.textContent = gameState.fanData.seasonTicketsSold;
    if (ticketPriceStat) ticketPriceStat.textContent = gameState.fanData.matchdayTicketPrice;
}

/**
 * Update financial UI displays
 */
export function updateFinancialUI() {
    const clubBalanceDisplay = document.getElementById('club-balance-display');
    const weeklyExpensesDisplay = document.getElementById('weekly-expenses-display');
    const seasonTicketRevenueDisplay = document.getElementById('season-ticket-revenue-display');
    const tvRevenueDisplay = document.getElementById('tv-revenue-display');

    if (clubBalanceDisplay) {
        clubBalanceDisplay.textContent = formatNumber(gameState.clubData.finances);
    }
    if (weeklyExpensesDisplay) {
        weeklyExpensesDisplay.textContent = formatNumber(gameState.clubData.weeklyWages);
    }
    if (seasonTicketRevenueDisplay) {
        seasonTicketRevenueDisplay.textContent = formatNumber(gameState.clubData.seasonTicketRevenue);
    }
    if (tvRevenueDisplay) {
        tvRevenueDisplay.textContent = formatNumber(gameState.clubData.tvRevenue);
    }
}

/**
 * Toggle mobile sidebar
 */
export function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Open a tab
 * @param {Event} evt - Click event
 * @param {string} tabName - Name of tab to open
 */
export function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }

    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

/**
 * Open a world tab
 * @param {Event} evt - Click event
 * @param {string} tabName - Name of tab to open
 */
export function openWorldTab(evt, tabName) {
    const worldTabContent = document.querySelectorAll('#world .tab-content');
    const worldTabLinks = document.querySelectorAll('#world .tab-link');

    worldTabContent.forEach(content => content.classList.remove("active"));
    worldTabLinks.forEach(link => link.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}
