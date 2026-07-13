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

    // Home advantage: extra chance of a bonus goal for the home side
    HOME_ADVANTAGE_CHANCE: 0.08,

    // Tactics: risk profiles instead of flat modifiers
    TACTIC_ATTACK_BONUS_CHANCE: 0.35,   // chance of +1 own goal
    TACTIC_ATTACK_CONCEDE_CHANCE: 0.20, // chance of +1 opponent goal (risk)
    TACTIC_DEFENSIVE_BLOCK_CHANCE: 0.40,   // chance of cancelling one opponent goal
    TACTIC_DEFENSIVE_MISFIRE_CHANCE: 0.25, // chance of -1 own goal (risk)
    TACTIC_COUNTER_BONUS_CHANCE: 0.30,  // chance of +1 own goal, only when the underdog

    // Squad fitness: a season-long resource that decays with matches and is
    // protected by training level; low fitness slightly reduces effective strength
    FITNESS_MIN: 30,
    FITNESS_MAX: 100,
    FITNESS_DRAIN_PER_MATCHDAY_BASE: 4,
    FITNESS_DRAIN_REDUCTION_PER_TRAINING_LEVEL: 0.5,
    FITNESS_STRENGTH_MULTIPLIER_BASE: 0.8,
    FITNESS_STRENGTH_MULTIPLIER_RANGE: 0.2,

    // Match events: rare flavour events that can nudge a result
    MATCH_EVENT_CHANCE: 0.25,

    // Board expectations & sacking: job security drifts based on league position vs. expectation
    BOARD_EXPECTATION_SLACK: 1,          // positions of slack before the board reacts
    BOARD_PRESSURE_POSITIVE_DRIFT: 1,    // job security gained per matchday when meeting expectation
    BOARD_PRESSURE_NEGATIVE_DRIFT: -2,   // job security lost per matchday when badly missing expectation
    BOARD_PRESSURE_MISS_THRESHOLD: 3,    // positions below expectation before negative drift kicks in
    SACKING_JOB_SECURITY_THRESHOLD: 0,

    // Career mode: job offers shown on the job board after a sacking
    JOB_OFFERS_PER_TIER: 2,              // weak / mid / strong clubs offered
    JOB_OFFER_REPUTATION_PER_STRENGTH: 5, // requiredReputation = baseStrength × this

    // Bankruptcy pressure
    BANKRUPTCY_FORCED_SALE_STRENGTH_PENALTY: 5,
    BANKRUPTCY_FORCED_SALE_JOB_SECURITY_PENALTY: 15,
    BANKRUPTCY_BAILOUT_AMOUNT: 20000,

    // Lifestyle upkeep: recurring personal cost charged periodically through the season
    LIFESTYLE_BILLING_INTERVAL_MATCHDAYS: 4,

    // Champions Cup: cross-league knockout for top-2 league finishers
    CHAMPIONS_CUP_QUALIFICATION_POSITION: 2, // finish this position or better to qualify
    CHAMPIONS_CUP_STAGE_NAMES: ['Round of 16', 'Quarterfinal', 'Semifinal', 'Final'],
    CHAMPIONS_CUP_REWARD_WINNER: { finances: 300000, reputation: 20 },
    CHAMPIONS_CUP_REWARD_FINALIST: { finances: 150000, reputation: 10 },
    CHAMPIONS_CUP_REWARD_SEMIFINALIST: { finances: 75000, reputation: 5 },
    CHAMPIONS_CUP_REWARD_QUARTERFINALIST: { finances: 25000, reputation: 2 },
    CHAMPIONS_CUP_REWARD_PARTICIPANT: { finances: 10000, reputation: 1 },

    // Achievements
    TYCOON_ACHIEVEMENT_FINANCES_THRESHOLD: 5000000,
    DYNASTY_ACHIEVEMENT_TROPHY_COUNT: 5,

    // Random events: a small decision pops up periodically between matchdays
    RANDOM_EVENT_INTERVAL_MATCHDAYS: 3,

    // Squad & transfer market: a lightweight 5-player key squad whose ratings
    // sum to roughly clubData.strength
    SQUAD_POSITIONS: ['GK', 'DF', 'MF', 'FW', 'Star'],
    PLAYER_RATING_MIN: 5,
    PLAYER_RATING_MAX: 25,
    PLAYER_VALUE_PER_RATING: 4000,
    PLAYER_SELL_VALUE_MULTIPLIER: 0.7,
    TRANSFER_MARKET_LISTING_COUNT: 6,

    // Injuries & suspensions: a chance each matchday that an available squad
    // member is ruled out for a stretch of matches
    INJURY_OR_SUSPENSION_CHANCE_PER_MATCH: 0.08,
    INJURY_CHANCE_SHARE: 0.7, // vs. suspension, of events that fire
    INJURY_DURATION_MATCHES_MIN: 2,
    INJURY_DURATION_MATCHES_MAX: 5,
    SUSPENSION_DURATION_MATCHES: 1,

    // Youth academy payoff: each season, a chance (scaling with academy level)
    // to produce a free prospect who replaces the weakest squad member
    ACADEMY_PROSPECT_CHANCE_PER_LEVEL: 0.08,
    ACADEMY_PROSPECT_RATING_MIN: 10,
    ACADEMY_PROSPECT_RATING_MAX: 18,

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
