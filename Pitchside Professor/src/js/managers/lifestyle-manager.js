/**
 * Lifestyle Manager Module
 * Handles manager lifestyle purchases and personal upgrades
 */

import { gameState } from '../core/state-manager.js';
import { showNotification } from '../ui/notification-system.js';

/**
 * Initialize the lifestyle system
 */
export function initializeLifestyle() {
    const lifestyleButtons = document.querySelectorAll('.lifestyle-btn');
    
    lifestyleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const item = e.target.closest('.lifestyle-item');
            const itemType = item.getAttribute('data-item');
            const cost = parseInt(item.getAttribute('data-cost'));
            const reputation = parseInt(item.getAttribute('data-reputation'));
            
            purchaseLifestyleItem(itemType, cost, reputation);
        });
    });
    
    updateLifestyleUI();
}

/**
 * Charge the manager's personal wealth for the upkeep of owned lifestyle
 * items. Called periodically (every few matchdays), not every matchday, so
 * lifestyle is a recurring budget line rather than a one-time purchase.
 */
export function chargeLifestyleUpkeep() {
    const { managerData } = gameState;
    if (managerData.lifestyle.length === 0) return;

    const totalCost = managerData.lifestyle.reduce((sum, item) => sum + item.cost, 0);
    if (totalCost === 0) return;

    managerData.wealth = Math.max(0, managerData.wealth - totalCost);
    showNotification('Lifestyle Upkeep', `$${totalCost.toLocaleString()} deducted for lifestyle upkeep.`, 'info');
    updateLifestyleUI();
}

/**
 * Purchase a lifestyle item
 * @param {string} itemType Type of lifestyle item
 * @param {number} cost Cost of the item
 * @param {number} reputation Reputation bonus
 */
export function purchaseLifestyleItem(itemType, cost, reputation) {
    const { managerData } = gameState;
    
    if (managerData.wealth < cost) {
        showNotification('Insufficient Funds', `You need $${cost.toLocaleString()} to afford this lifestyle upgrade.`, 'error');
        return;
    }
    
    // Check if already owned
    const existingItem = managerData.lifestyle.find(item => item.type === itemType);
    if (existingItem) {
        showNotification('Already Owned', 'You already have this lifestyle item.', 'warning');
        return;
    }
    
    // Remove conflicting items (same category)
    const categories = {
        'apartment': 'housing',
        'house': 'housing', 
        'mansion': 'housing',
        'car': 'transport',
        'luxury_car': 'transport',
        'sports_car': 'transport',
        'dining': 'entertainment',
        'entertainment': 'entertainment'
    };
    
    const category = categories[itemType];
    managerData.lifestyle = managerData.lifestyle.filter(item => categories[item.type] !== category);
    
    // Add new item
    managerData.lifestyle.push({
        type: itemType,
        cost: cost,
        reputation: reputation
    });
    
    // Deduct cost
    managerData.wealth -= cost;
    
    // Add reputation
    managerData.reputation += reputation;
    
    showNotification('Lifestyle Upgrade', `You've upgraded your lifestyle! +${reputation} reputation`, 'success');
    
    updateLifestyleUI();
    updateSidebarDisplays();
}

/**
 * Update lifestyle UI displays
 */
export function updateLifestyleUI() {
    const { managerData } = gameState;
    const currentItems = document.getElementById('current-lifestyle-items');
    const monthlyCost = document.getElementById('lifestyle-monthly-cost');
    const reputationBonus = document.getElementById('lifestyle-reputation-bonus');
    
    if (managerData.lifestyle.length === 0) {
        if (currentItems) {
            currentItems.innerHTML = '<p>Living modestly...</p>';
        }
        if (monthlyCost) {
            monthlyCost.textContent = '0';
        }
        if (reputationBonus) {
            reputationBonus.textContent = '0';
        }
    } else {
        const itemNames = {
            'apartment': '🏠 City Apartment',
            'house': '🏠 Suburban House',
            'mansion': '🏠 Luxury Mansion',
            'car': '🚗 Economy Car',
            'luxury_car': '🚗 Luxury Car',
            'sports_car': '🚗 Sports Car',
            'dining': '🍽️ Fine Dining',
            'entertainment': '🎭 VIP Entertainment'
        };
        
        if (currentItems) {
            currentItems.innerHTML = managerData.lifestyle.map(item => 
                `<p>${itemNames[item.type]} - $${item.cost.toLocaleString()}/month</p>`
            ).join('');
        }
        
        const totalCost = managerData.lifestyle.reduce((sum, item) => sum + item.cost, 0);
        const totalReputation = managerData.lifestyle.reduce((sum, item) => sum + item.reputation, 0);
        
        if (monthlyCost) {
            monthlyCost.textContent = totalCost.toLocaleString();
        }
        if (reputationBonus) {
            reputationBonus.textContent = totalReputation;
        }
    }
    
    // Update button states
    document.querySelectorAll('.lifestyle-item').forEach(item => {
        const itemType = item.getAttribute('data-item');
        const cost = parseInt(item.getAttribute('data-cost'));
        const button = item.querySelector('.lifestyle-btn');
        
        if (!button) return;
        
        const owned = managerData.lifestyle.find(li => li.type === itemType);
        const canAfford = managerData.wealth >= cost;
        
        if (owned) {
            button.textContent = 'Owned';
            button.disabled = true;
        } else if (!canAfford) {
            button.textContent = 'Too Expensive';
            button.disabled = true;
        } else {
            button.disabled = false;
            const actions = {
                'apartment': 'Rent',
                'house': 'Buy',
                'mansion': 'Buy',
                'car': 'Lease',
                'luxury_car': 'Lease',
                'sports_car': 'Lease',
                'dining': 'Subscribe',
                'entertainment': 'Subscribe'
            };
            button.textContent = actions[itemType] || 'Purchase';
        }
    });
}

/**
 * Update sidebar displays (placeholder)
 */
function updateSidebarDisplays() {
    // Call the global updateSidebarDisplays if it exists
    if (typeof window.updateSidebarDisplays === 'function') {
        window.updateSidebarDisplays();
    }
}
