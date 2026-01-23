/**
 * Dice Rolling Utilities
 * Handles weighted dice rolls and animations
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

/**
 * Animate dice rolling effect
 * @param {Function} callback - Function to call after animation completes
 */
export function animateDiceRoll(callback) {
    const dice1 = document.getElementById('dice1');
    const dice2 = document.getElementById('dice2');

    dice1.classList.add('rolling');
    dice2.classList.add('rolling');

    setTimeout(() => {
        dice1.classList.remove('rolling');
        dice2.classList.remove('rolling');
        if (callback) callback();
    }, 1000);
}

/**
 * Update dice display to show specific values
 * @param {number} homeGoals - Home team goals
 * @param {number} awayGoals - Away team goals
 */
export function updateDiceDisplay(homeGoals, awayGoals) {
    const dice1Faces = document.querySelectorAll('#dice1 .face');
    const dice2Faces = document.querySelectorAll('#dice2 .face');

    dice1Faces.forEach(face => {
        face.textContent = homeGoals;
    });

    dice2Faces.forEach(face => {
        face.textContent = awayGoals;
    });
}
