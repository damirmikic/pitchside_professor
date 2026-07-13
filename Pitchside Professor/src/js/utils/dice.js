/**
 * Dice Rolling Utilities
 */

import { GAME_CONSTANTS } from '../data/constants.js';

/**
 * Roll a weighted dice (0-5 with specified probabilities)
 * @returns {number} Dice value between 0-5
 */
export function rollWeightedDice() {
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < GAME_CONSTANTS.DICE_WEIGHTS.length; i++) {
        cumulative += GAME_CONSTANTS.DICE_WEIGHTS[i];
        if (random < cumulative) {
            return i;
        }
    }
    return 5;
}
