/**
 * Formatting Utilities
 * Helper functions for formatting numbers, text, and other values
 */

import { GAME_CONSTANTS } from '../data/constants.js';

/**
 * Get ordinal suffix for a number (st, nd, rd, th)
 * @param {number} num - The number to get suffix for
 * @returns {string} The ordinal suffix
 */
export function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + "st";
    if (j === 2 && k !== 12) return num + "nd";
    if (j === 3 && k !== 13) return num + "rd";
    return num + "th";
}

/**
 * Get stadium level name from level number
 * @param {number} level - Stadium level (1-4)
 * @returns {string} Stadium level name
 */
export function getStadiumLevelName(level) {
    return GAME_CONSTANTS.STADIUM_LEVELS[level] || 'Small';
}

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
    return '$' + amount.toLocaleString();
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
    return num.toLocaleString();
}
