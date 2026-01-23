/**
 * Club Manager Module
 * Handles club development including training, academy, stadium, and facilities
 */

import { gameState } from '../core/game-state.js';
import { showConfirmPopup, showErrorPopup, showSuccessPopup } from '../ui/popup-manager.js';
import { updateUI } from '../ui/ui-manager.js';

/**
 * Upgrade training facilities
 */
export function upgradeTraining() {
    const { clubData, managerData } = gameState;
    const cost = clubData.trainingLevel * 50000;
    
    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Training',
            `Upgrade training facilities to level \${clubData.trainingLevel + 1} for $\${cost.toLocaleString()}?`,
            () => {
                clubData.finances -= cost;
                clubData.trainingLevel++;
                clubData.strength += 5;
                
                const upgradeBtn = document.getElementById('upgrade-training-btn');
                if (upgradeBtn) {
                    upgradeBtn.textContent = `Upgrade Training (Lvl \${clubData.trainingLevel})`;
                }
                
                updateUI();
                showSuccessPopup('Training Upgraded!', 'Team strength increased by 5 points.');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $\${cost.toLocaleString()} to upgrade training.`);
    }
}

/**
 * Upgrade youth academy
 */
export function upgradeAcademy() {
    const { clubData, managerData } = gameState;
    const cost = clubData.academyLevel * 75000;
    
    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Academy',
            `Upgrade youth academy to level \${clubData.academyLevel + 1} for $\${cost.toLocaleString()}?`,
            () => {
                clubData.finances -= cost;
                clubData.academyLevel++;
                managerData.reputation += 3;
                
                const upgradeBtn = document.getElementById('upgrade-academy-btn');
                if (upgradeBtn) {
                    upgradeBtn.textContent = `Upgrade Academy (Lvl \${clubData.academyLevel})`;
                }
                
                updateUI();
                showSuccessPopup('Academy Upgraded!', 'Reputation increased and future talent improved.');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $\${cost.toLocaleString()} to upgrade the academy.`);
    }
}

/**
 * Expand stadium capacity
 */
export function expandStadium() {
    const { clubData, managerData, fanData } = gameState;
    const cost = clubData.stadiumLevel * 50000;
    const expansionSize = clubData.stadiumLevel <= 3 ? 1000 : 2000;
    const newCapacity = clubData.stadiumCapacity + expansionSize;

    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Expand Stadium',
            `Expand stadium capacity to \${newCapacity.toLocaleString()} for $\${cost.toLocaleString()}?`,
            () => {
                clubData.finances -= cost;
                clubData.stadiumLevel++;
                clubData.stadiumCapacity = newCapacity;
                managerData.reputation += 5;
                fanData.happiness = Math.min(100, fanData.happiness + 15);

                // Update stadium image based on level
                const stadiumImage = document.getElementById('stadium-image');
                if (stadiumImage) {
                    if (clubData.stadiumLevel >= 4) {
                        stadiumImage.src = 'elite stadium.png';
                    } else if (clubData.stadiumLevel >= 3) {
                        stadiumImage.src = 'large stadium.png';
                    } else if (clubData.stadiumLevel >= 2) {
                        stadiumImage.src = 'medium stadium.png';
                    }
                }

                updateUI();
                showSuccessPopup('Stadium Expanded!', `Capacity increased to \${newCapacity.toLocaleString()}. Fan happiness and reputation increased!`);
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $\${cost.toLocaleString()} to expand the stadium.`);
    }
}

/**
 * Upgrade concessions facilities
 */
export function upgradeConcessions() {
    const { clubData, managerData, fanData } = gameState;
    const cost = 75000;

    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Concessions',
            `Upgrade food and beverage facilities for $\${cost.toLocaleString()}? This will increase matchday revenue.`,
            () => {
                clubData.finances -= cost;
                fanData.happiness = Math.min(100, fanData.happiness + 8);
                managerData.wealth += 25000; // Increased revenue
                updateUI();
                showSuccessPopup('Concessions Upgraded!', 'Fan happiness increased and matchday revenue improved!');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $\${cost.toLocaleString()} to upgrade concessions.`);
    }
}

/**
 * Upgrade club store
 */
export function upgradeStore() {
    const { clubData, managerData, fanData } = gameState;
    const cost = 50000;

    if (clubData.finances >= cost) {
        showConfirmPopup(
            'Upgrade Club Store',
            `Upgrade the club merchandise store for $\${cost.toLocaleString()}? This will increase merchandise revenue.`,
            () => {
                clubData.finances -= cost;
                managerData.wealth += 15000; // Merchandise revenue
                fanData.happiness = Math.min(100, fanData.happiness + 5);
                updateUI();
                showSuccessPopup('Store Upgraded!', 'Merchandise revenue increased and fan happiness improved!');
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $\${cost.toLocaleString()} to upgrade the store.`);
    }
}
