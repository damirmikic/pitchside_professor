/**
 * Club Manager Module
 * Handles club development including training, academy, stadium, and facilities
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showConfirmPopup, showErrorPopup, showSuccessPopup } from '../ui/notification-system.js';
import { updateUI } from '../ui/ui-controller.js';

/**
 * Upgrade training facilities
 */
export function upgradeTraining() {
    const { clubData, managerData } = gameState;
    const cost = clubData.trainingLevel * GAME_CONSTANTS.TRAINING_UPGRADE_MULTIPLIER;
    
    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Training',
            `Upgrade training facilities to level ${clubData.trainingLevel + 1} for $${cost.toLocaleString()}?`,
            () => {
                clubData.finances -= cost;
                clubData.trainingLevel++;
                clubData.strength += 5;
                
                const upgradeBtn = document.getElementById('upgrade-training-btn');
                if (upgradeBtn) {
                    upgradeBtn.textContent = `Upgrade Training (Lvl ${clubData.trainingLevel})`;
                }
                
                updateUI();
                showSuccessPopup('Training Upgraded!', 'Team strength increased by 5 points.');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $${cost.toLocaleString()} to upgrade training.`);
    }
}

/**
 * Upgrade youth academy
 */
export function upgradeAcademy() {
    const { clubData, managerData } = gameState;
    const cost = clubData.academyLevel * GAME_CONSTANTS.ACADEMY_UPGRADE_MULTIPLIER;
    
    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Academy',
            `Upgrade youth academy to level ${clubData.academyLevel + 1} for $${cost.toLocaleString()}?`,
            () => {
                clubData.finances -= cost;
                clubData.academyLevel++;
                managerData.reputation += 3;
                
                const upgradeBtn = document.getElementById('upgrade-academy-btn');
                if (upgradeBtn) {
                    upgradeBtn.textContent = `Upgrade Academy (Lvl ${clubData.academyLevel})`;
                }
                
                updateUI();
                showSuccessPopup('Academy Upgraded!', 'Reputation increased and future talent improved.');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $${cost.toLocaleString()} to upgrade the academy.`);
    }
}

/**
 * Expand stadium capacity
 */
export function expandStadium() {
    const { clubData, managerData, fanData } = gameState;
    const cost = clubData.stadiumLevel * GAME_CONSTANTS.STADIUM_EXPANSION_MULTIPLIER;
    const expansionSize = clubData.stadiumLevel <= 3 ? 1000 : 2000;
    const newCapacity = clubData.stadiumCapacity + expansionSize;

    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Expand Stadium',
            `Expand stadium capacity to ${newCapacity.toLocaleString()} for $${cost.toLocaleString()}?`,
            () => {
                clubData.finances -= cost;
                clubData.stadiumLevel++;
                clubData.stadiumCapacity = newCapacity;
                managerData.reputation += 5;
                fanData.happiness = Math.min(100, fanData.happiness + 15);

                // Update stadium image based on level
                const stadiumImage = document.getElementById('stadium-image');
                const stadiumImageWebp = document.getElementById('stadium-image-webp');
                if (stadiumImage && stadiumImageWebp) {
                    let imageName;
                    if (clubData.stadiumLevel >= 3) {
                        imageName = 'world stadium';
                    } else if (clubData.stadiumLevel >= 2) {
                        imageName = 'mid stadium';
                    } else {
                        imageName = 'small stadium';
                    }
                    stadiumImageWebp.srcset = `assets/images/${imageName}.webp`;
                    stadiumImage.src = `assets/images/${imageName}.png`;
                }

                updateUI();
                showSuccessPopup('Stadium Expanded!', `Capacity increased to ${newCapacity.toLocaleString()}. Fan happiness and reputation increased!`);
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $${cost.toLocaleString()} to expand the stadium.`);
    }
}

/**
 * Upgrade concessions facilities
 * Increases the club's per-fan concession revenue on matchdays (does not pay the manager directly)
 */
export function upgradeConcessions() {
    const { clubData, fanData } = gameState;
    const cost = clubData.concessionsLevel * GAME_CONSTANTS.CONCESSIONS_UPGRADE_MULTIPLIER;

    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Concessions',
            `Upgrade food and beverage facilities to level ${clubData.concessionsLevel + 1} for $${cost.toLocaleString()}? This will increase matchday revenue.`,
            () => {
                clubData.finances -= cost;
                clubData.concessionsLevel++;
                fanData.happiness = Math.min(100, fanData.happiness + 8);
                updateUI();
                showSuccessPopup('Concessions Upgraded!', 'Fan happiness increased and matchday concession revenue improved!');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $${cost.toLocaleString()} to upgrade concessions.`);
    }
}

/**
 * Upgrade club store
 * Increases the club's per-fan merchandise revenue on matchdays (does not pay the manager directly)
 */
export function upgradeStore() {
    const { clubData, fanData } = gameState;
    const cost = clubData.storeLevel * GAME_CONSTANTS.STORE_UPGRADE_MULTIPLIER;

    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Club Store',
            `Upgrade the club merchandise store to level ${clubData.storeLevel + 1} for $${cost.toLocaleString()}? This will increase merchandise revenue.`,
            () => {
                clubData.finances -= cost;
                clubData.storeLevel++;
                fanData.happiness = Math.min(100, fanData.happiness + 5);
                updateUI();
                showSuccessPopup('Store Upgraded!', 'Merchandise revenue increased and fan happiness improved!');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $${cost.toLocaleString()} to upgrade the store.`);
    }
}
