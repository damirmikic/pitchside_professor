/**
 * Fan Manager Module
 * Handles fan engagement including promotions and press conferences
 */

import { gameState } from '../core/state-manager.js';
import { showConfirmPopup, showErrorPopup, showSuccessPopup } from '../ui/notification-system.js';
import { showNotification } from '../ui/notification-system.js';
import { updateUI } from '../ui/ui-controller.js';

/**
 * Run a promotional campaign
 * @param {string} type Type of promotion (radio, tv, newspaper)
 */
export function runPromotion(type) {
    const { clubData, fanData } = gameState;
    const costs = { radio: 5000, tv: 15000, newspaper: 8000 };
    const effects = { radio: 5, tv: 15, newspaper: 8 };
    const cost = costs[type];
    const effect = effects[type];

    if (clubData.finances >= cost) {
        showConfirmPopup(
            `\${type.charAt(0).toUpperCase() + type.slice(1)} Promotion`,
            `Run a \${type} promotion for $\${cost.toLocaleString()}? This will increase fan happiness by \${effect} points.`,
            () => {
                clubData.finances -= cost;
                fanData.happiness = Math.min(100, fanData.happiness + effect);
                updateUI();
                showSuccessPopup('Promotion Successful!', `Fan happiness increased by \${effect} points.`);
            }
        );
    } else {
        showErrorPopup('Insufficient Funds', `You need $\${cost.toLocaleString()} for this promotion.`);
    }
}

/**
 * Hold a press conference
 */
export function holdPressConference() {
    const { managerData } = gameState;
    const messages = [
        "We're focused on improving our performance this season.",
        "The team is working hard in training and we're optimistic.",
        "Our fans deserve better and we're committed to delivering.",
        "We have full confidence in our squad and tactical approach.",
        "Every match is important and we take nothing for granted."
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    showNotification('Press Conference', `Manager: "\${message}"`, 'info');
    
    // Small reputation boost
    managerData.reputation += 1;
    
    // Update sidebar displays if function exists
    if (typeof updateSidebarDisplays === 'function') {
        updateSidebarDisplays();
    }
}
