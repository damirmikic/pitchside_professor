/**
 * Game Constants
 * All hardcoded values and configuration
 */

export const GAME_CONSTANTS = {
    // Initial Values
    INITIAL_MANAGER_WEALTH: 50000,
    INITIAL_MANAGER_REPUTATION: 50,
    INITIAL_JOB_SECURITY: 75,
    INITIAL_CLUB_FINANCES: 100000,
    INITIAL_CLUB_STRENGTH: 50,
    INITIAL_FAN_HAPPINESS: 60,
    INITIAL_TRANSFER_BUDGET: 50000,

    // Financial
    WEEKLY_WAGES: 15000,
    SEASON_TICKET_PRICE_DEFAULT: 100,
    MATCHDAY_TICKET_PRICE_DEFAULT: 15,
    MAX_SEASON_TICKETS: 2500,

    // Stadium
    STADIUM_CAPACITY_MIN: 500,
    STADIUM_CAPACITY_MAX: 2000,
    STADIUM_INITIAL_LEVEL: 1,

    // Upgrade Costs
    TRAINING_UPGRADE_MULTIPLIER: 50000,  // level × 50000
    ACADEMY_UPGRADE_MULTIPLIER: 75000,   // level × 75000
    STADIUM_EXPANSION_MULTIPLIER: 50000, // level × 50000
    CONCESSIONS_UPGRADE_MULTIPLIER: 75000, // level × 75000
    STORE_UPGRADE_MULTIPLIER: 50000,       // level × 50000
    CONCESSION_REVENUE_PER_FAN_BASE: 3,
    CONCESSION_REVENUE_PER_FAN_PER_LEVEL: 2,
    MERCHANDISE_REVENUE_PER_FAN_BASE: 1,
    MERCHANDISE_REVENUE_PER_FAN_PER_LEVEL: 1,

    // Promotion Costs
    RADIO_PROMOTION_COST: 5000,
    TV_PROMOTION_COST: 15000,
    NEWSPAPER_AD_COST: 8000,

    // Pre-Season
    PRESEASON_DAYS: 14,
    PRESEASON_MAX_MATCHES: 3,
    PRESEASON_INITIAL_FITNESS: 75,
    PRESEASON_INITIAL_CHEMISTRY: 60,
    TRAINING_CAMP_COST: 10000,
    TRAINING_CAMP_DAYS: 3,

    // Dice Probabilities (for weighted rolls 0-5)
    DICE_WEIGHTS: [0.35, 0.25, 0.20, 0.10, 0.07, 0.03],

    // Tactics
    TACTIC_ATTACKING_BONUS: 1,
    TACTIC_ATTACKING_PENALTY: -1,
    TACTIC_DEFENSIVE_BONUS: -1,
    TACTIC_DEFENSIVE_PENALTY: 1,
    TACTIC_BALANCED_BONUS: 0,

    // Lifestyle Costs
    LIFESTYLE_ITEMS: {
        apartment: { cost: 2000, reputation: 5, name: 'City Apartment' },
        house: { cost: 5000, reputation: 10, name: 'Suburban House' },
        mansion: { cost: 15000, reputation: 25, name: 'Luxury Mansion' },
        car: { cost: 800, reputation: 3, name: 'Economy Car' },
        luxury_car: { cost: 2500, reputation: 8, name: 'Luxury Car' },
        sports_car: { cost: 8000, reputation: 20, name: 'Sports Car' },
        dining: { cost: 500, reputation: 2, name: 'Fine Dining' },
        entertainment: { cost: 1200, reputation: 5, name: 'VIP Entertainment' }
    },

    // Stadium Levels
    STADIUM_LEVELS: {
        1: 'Small',
        2: 'Medium',
        3: 'Large',
        4: 'Elite'
    }
};
