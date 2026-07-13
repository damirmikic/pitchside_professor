/**
 * UI Controller
 * Handles all UI updates and rendering with optimized DOM caching
 */

import { gameState } from '../core/state-manager.js';
import { getStadiumLevelName, formatCurrency, formatNumber, getOrdinalSuffix } from '../utils/formatters.js';
import { domUpdater } from '../utils/dom-batcher.js';

// DOM Element Cache - avoids repeated getElementById calls
const elementCache = new Map();

/**
 * Get cached DOM element or fetch and cache it
 * @param {string} id - Element ID
 * @returns {Element|null} The DOM element or null if not found
 */
function getCachedElement(id) {
    if (!elementCache.has(id)) {
        elementCache.set(id, document.getElementById(id));
    }
    return elementCache.get(id);
}

/**
 * Clear the element cache (call when DOM structure changes significantly)
 */
export function clearElementCache() {
    elementCache.clear();
    domUpdater.clearCache();
}

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
 * Update manager statistics displays using cached elements
 */
function updateManagerStats() {
    const wealthElement = getCachedElement('manager-wealth');
    const reputationElement = getCachedElement('manager-reputation');
    const jobSecurityBar = getCachedElement('job-security-bar');

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
 * Update club statistics displays using cached elements
 */
function updateClubStats() {
    const financesElement = getCachedElement('club-finances');
    const strengthElement = getCachedElement('club-strength');
    const fitnessElement = getCachedElement('squad-fitness-display');

    if (financesElement) {
        financesElement.textContent = formatCurrency(gameState.clubData.finances);
    }
    if (strengthElement) {
        strengthElement.textContent = gameState.clubData.strength;
    }
    if (fitnessElement) {
        fitnessElement.textContent = `${gameState.clubData.fitness}%`;
    }
}

/**
 * Update fan statistics displays using cached elements
 */
function updateFanStats() {
    const fanHappinessBar = getCachedElement('fan-happiness-bar');

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
 * Update stadium information display using cached elements
 */
function updateStadiumInfo() {
    const stadiumInfoElement = getCachedElement('stadium-info');
    if (stadiumInfoElement) {
        stadiumInfoElement.textContent =
            `Current Capacity: ${formatNumber(gameState.clubData.stadiumCapacity)} | Level: ${getStadiumLevelName(gameState.clubData.stadiumLevel)}`;
    }
}

/**
 * Update season ticket display using cached elements
 */
export function updateSeasonTicketDisplay() {
    const seasonTicketsInfo = getCachedElement('season-tickets-info');
    if (seasonTicketsInfo) {
        seasonTicketsInfo.textContent =
            `Season tickets sold: ${formatNumber(gameState.fanData.seasonTicketsSold)}/${formatNumber(gameState.fanData.maxSeasonTickets)}`;
    }
}

/**
 * Update ticket price displays using cached elements
 */
function updateTicketPrices() {
    const seasonTicketValue = getCachedElement('season-ticket-price-value');
    const matchdayTicketValue = getCachedElement('matchday-ticket-price-value');

    if (seasonTicketValue) {
        seasonTicketValue.textContent = formatCurrency(gameState.fanData.seasonTicketPrice);
    }
    if (matchdayTicketValue) {
        matchdayTicketValue.textContent = formatCurrency(gameState.fanData.matchdayTicketPrice);
    }
}

/**
 * Update sidebar displays (wealth, reputation, season, matchday) using cached elements
 */
export function updateSidebarDisplays() {
    const wealthDisplay = getCachedElement('manager-wealth-display');
    const reputationDisplay = getCachedElement('manager-reputation-display');
    const seasonDisplay = getCachedElement('season-display');
    const matchdayDisplay = getCachedElement('matchday-display');

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
 * Update all section-specific UIs using cached elements
 */
export function updateAllSectionUIs() {
    // Manager section
    const managerWealthStat = getCachedElement('manager-wealth-stat');
    const managerReputationStat = getCachedElement('manager-reputation-stat');
    const managerJobSecurityStat = getCachedElement('manager-job-security-stat');

    if (managerWealthStat) managerWealthStat.textContent = formatNumber(gameState.managerData.wealth);
    if (managerReputationStat) managerReputationStat.textContent = gameState.managerData.reputation;
    if (managerJobSecurityStat) managerJobSecurityStat.textContent = gameState.managerData.jobSecurity;

    // Club section
    const clubStrengthStat = getCachedElement('club-strength-stat');
    const clubCapacityStat = getCachedElement('club-capacity-stat');
    const clubFinancesStat = getCachedElement('club-finances-stat');

    if (clubStrengthStat) clubStrengthStat.textContent = gameState.clubData.strength;
    if (clubCapacityStat) clubCapacityStat.textContent = formatNumber(gameState.clubData.stadiumCapacity);
    if (clubFinancesStat) clubFinancesStat.textContent = formatNumber(gameState.clubData.finances);

    // Fans section
    const fanHappinessStat = getCachedElement('fan-happiness-stat');
    const seasonTicketsSoldStat = getCachedElement('season-tickets-sold-stat');
    const ticketPriceStat = getCachedElement('ticket-price-stat');

    if (fanHappinessStat) fanHappinessStat.textContent = gameState.fanData.happiness;
    if (seasonTicketsSoldStat) seasonTicketsSoldStat.textContent = gameState.fanData.seasonTicketsSold;
    if (ticketPriceStat) ticketPriceStat.textContent = gameState.fanData.matchdayTicketPrice;
}

/**
 * Update financial UI displays using cached elements
 */
export function updateFinancialUI() {
    const clubBalanceDisplay = getCachedElement('club-balance-display');
    const weeklyExpensesDisplay = getCachedElement('weekly-expenses-display');
    const seasonTicketRevenueDisplay = getCachedElement('season-ticket-revenue-display');
    const tvRevenueDisplay = getCachedElement('tv-revenue-display');

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
 * Toggle mobile sidebar using cached element
 */
export function toggleMobileSidebar() {
    const sidebar = getCachedElement('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Open a tab using cached element
 * @param {Event|null} evt - Click event (null when called programmatically, e.g. from season transitions)
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

    const targetTab = getCachedElement(tabName);
    if (targetTab) {
        targetTab.classList.add("active");

        // The World tab nests its own sub-tabs (Current Standings / Past
        // Champions); the blanket "remove active" above also strips whichever
        // of those was showing, since it matches every .tab-content in the
        // document regardless of nesting. Restore a default if none is active.
        if (tabName === 'world' && !targetTab.querySelector('.tab-content.active')) {
            const defaultSubTab = targetTab.querySelector('.tab-content');
            const defaultSubLink = targetTab.querySelector('.tab-link');
            if (defaultSubTab) defaultSubTab.classList.add('active');
            if (defaultSubLink) defaultSubLink.classList.add('active');
        }
    }
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }
}

/**
 * Open a world tab using cached element
 * @param {Event} evt - Click event
 * @param {string} tabName - Name of tab to open
 */
export function openWorldTab(evt, tabName) {
    const worldTabContent = document.querySelectorAll('#world .tab-content');
    const worldTabLinks = document.querySelectorAll('#world .tab-link');

    worldTabContent.forEach(content => content.classList.remove("active"));
    worldTabLinks.forEach(link => link.classList.remove("active"));

    const targetTab = getCachedElement(tabName);
    if (targetTab) {
        targetTab.classList.add("active");
    }
    evt.currentTarget.classList.add("active");
}
