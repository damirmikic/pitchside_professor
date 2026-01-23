/**
 * Game State Integrity Validator
 * Validates game state for impossible values and detects potential cheating
 */

import { GAME_CONSTANTS } from '../data/constants.js';

/**
 * Validation result
 * @typedef {Object} IntegrityResult
 * @property {boolean} valid - Whether the state is valid
 * @property {Array<string>} errors - Array of error messages
 * @property {Array<string>} warnings - Array of warning messages
 * @property {Object} corrected - Corrected values (if auto-fix is enabled)
 */

/**
 * Validate entire game state for integrity
 * @param {Object} gameState - Game state object to validate
 * @param {boolean} autoFix - Whether to automatically fix issues
 * @returns {IntegrityResult}
 */
export function validateGameState(gameState, autoFix = false) {
    const errors = [];
    const warnings = [];
    const corrected = {};

    // Validate manager data
    const managerResult = validateManagerData(gameState.managerData, autoFix);
    errors.push(...managerResult.errors);
    warnings.push(...managerResult.warnings);
    if (autoFix) {
        corrected.managerData = managerResult.corrected;
    }

    // Validate club data
    const clubResult = validateClubData(gameState.clubData, autoFix);
    errors.push(...clubResult.errors);
    warnings.push(...clubResult.warnings);
    if (autoFix) {
        corrected.clubData = clubResult.corrected;
    }

    // Validate fan data
    const fanResult = validateFanData(gameState.fanData, autoFix);
    errors.push(...fanResult.errors);
    warnings.push(...fanResult.warnings);
    if (autoFix) {
        corrected.fanData = fanResult.corrected;
    }

    // Validate season/matchday data
    const seasonResult = validateSeasonData(gameState, autoFix);
    errors.push(...seasonResult.errors);
    warnings.push(...seasonResult.warnings);
    if (autoFix) {
        Object.assign(corrected, seasonResult.corrected);
    }

    // Validate relationships between data
    const relationshipResult = validateRelationships(gameState);
    errors.push(...relationshipResult.errors);
    warnings.push(...relationshipResult.warnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        corrected: autoFix ? corrected : null
    };
}

/**
 * Validate manager data
 * @param {Object} managerData - Manager data object
 * @param {boolean} autoFix - Whether to auto-fix
 * @returns {IntegrityResult}
 */
export function validateManagerData(managerData, autoFix = false) {
    const errors = [];
    const warnings = [];
    const corrected = autoFix ? { ...managerData } : {};

    // Validate wealth
    if (typeof managerData.wealth !== 'number' || !isFinite(managerData.wealth)) {
        errors.push('Manager wealth must be a valid number');
        if (autoFix) corrected.wealth = GAME_CONSTANTS.INITIAL_MANAGER_WEALTH;
    } else if (managerData.wealth < 0) {
        errors.push('Manager wealth cannot be negative');
        if (autoFix) corrected.wealth = 0;
    } else if (managerData.wealth > 100000000) {
        warnings.push('Manager wealth is unusually high (possible cheat)');
    }

    // Validate reputation
    if (typeof managerData.reputation !== 'number' || !isFinite(managerData.reputation)) {
        errors.push('Manager reputation must be a valid number');
        if (autoFix) corrected.reputation = GAME_CONSTANTS.INITIAL_MANAGER_REPUTATION;
    } else if (managerData.reputation < 0 || managerData.reputation > 100) {
        errors.push('Manager reputation must be between 0 and 100');
        if (autoFix) corrected.reputation = Math.max(0, Math.min(100, managerData.reputation));
    }

    // Validate job security
    if (typeof managerData.jobSecurity !== 'number' || !isFinite(managerData.jobSecurity)) {
        errors.push('Job security must be a valid number');
        if (autoFix) corrected.jobSecurity = GAME_CONSTANTS.INITIAL_JOB_SECURITY;
    } else if (managerData.jobSecurity < 0 || managerData.jobSecurity > 100) {
        errors.push('Job security must be between 0 and 100');
        if (autoFix) corrected.jobSecurity = Math.max(0, Math.min(100, managerData.jobSecurity));
    }

    // Validate lifestyle array
    if (!Array.isArray(managerData.lifestyle)) {
        errors.push('Manager lifestyle must be an array');
        if (autoFix) corrected.lifestyle = [];
    }

    return { valid: errors.length === 0, errors, warnings, corrected };
}

/**
 * Validate club data
 * @param {Object} clubData - Club data object
 * @param {boolean} autoFix - Whether to auto-fix
 * @returns {IntegrityResult}
 */
export function validateClubData(clubData, autoFix = false) {
    const errors = [];
    const warnings = [];
    const corrected = autoFix ? { ...clubData } : {};

    // Validate finances
    if (typeof clubData.finances !== 'number' || !isFinite(clubData.finances)) {
        errors.push('Club finances must be a valid number');
        if (autoFix) corrected.finances = GAME_CONSTANTS.INITIAL_CLUB_FINANCES;
    } else if (clubData.finances < -10000000) {
        warnings.push('Club is heavily in debt');
    } else if (clubData.finances > 1000000000) {
        warnings.push('Club finances are unusually high (possible cheat)');
    }

    // Validate strength
    if (typeof clubData.strength !== 'number' || !isFinite(clubData.strength)) {
        errors.push('Club strength must be a valid number');
        if (autoFix) corrected.strength = GAME_CONSTANTS.INITIAL_CLUB_STRENGTH;
    } else if (clubData.strength < 1 || clubData.strength > 100) {
        errors.push('Club strength must be between 1 and 100');
        if (autoFix) corrected.strength = Math.max(1, Math.min(100, clubData.strength));
    }

    // Validate upgrade levels
    const upgradeLevels = ['trainingLevel', 'academyLevel', 'stadiumLevel'];
    for (const level of upgradeLevels) {
        if (!Number.isInteger(clubData[level])) {
            errors.push(`${level} must be an integer`);
            if (autoFix) corrected[level] = 1;
        } else if (clubData[level] < 1 || clubData[level] > 10) {
            errors.push(`${level} must be between 1 and 10`);
            if (autoFix) corrected[level] = Math.max(1, Math.min(10, clubData[level]));
        }
    }

    // Validate stadium capacity
    if (!Number.isInteger(clubData.stadiumCapacity)) {
        errors.push('Stadium capacity must be an integer');
        if (autoFix) corrected.stadiumCapacity = GAME_CONSTANTS.STADIUM_CAPACITY_MIN;
    } else if (clubData.stadiumCapacity < 100 || clubData.stadiumCapacity > 100000) {
        errors.push('Stadium capacity must be between 100 and 100,000');
        if (autoFix) {
            corrected.stadiumCapacity = Math.max(100, Math.min(100000, clubData.stadiumCapacity));
        }
    }

    // Validate weekly wages
    if (typeof clubData.weeklyWages !== 'number' || !isFinite(clubData.weeklyWages)) {
        errors.push('Weekly wages must be a valid number');
        if (autoFix) corrected.weeklyWages = GAME_CONSTANTS.WEEKLY_WAGES;
    } else if (clubData.weeklyWages < 0) {
        errors.push('Weekly wages cannot be negative');
        if (autoFix) corrected.weeklyWages = GAME_CONSTANTS.WEEKLY_WAGES;
    } else if (clubData.weeklyWages === 0) {
        warnings.push('Weekly wages are zero (is this intentional?)');
    }

    // Validate transfer budget
    if (typeof clubData.transferBudget !== 'number' || !isFinite(clubData.transferBudget)) {
        errors.push('Transfer budget must be a valid number');
        if (autoFix) corrected.transferBudget = 0;
    } else if (clubData.transferBudget < 0) {
        errors.push('Transfer budget cannot be negative');
        if (autoFix) corrected.transferBudget = 0;
    }

    return { valid: errors.length === 0, errors, warnings, corrected };
}

/**
 * Validate fan data
 * @param {Object} fanData - Fan data object
 * @param {boolean} autoFix - Whether to auto-fix
 * @returns {IntegrityResult}
 */
export function validateFanData(fanData, autoFix = false) {
    const errors = [];
    const warnings = [];
    const corrected = autoFix ? { ...fanData } : {};

    // Validate happiness
    if (typeof fanData.happiness !== 'number' || !isFinite(fanData.happiness)) {
        errors.push('Fan happiness must be a valid number');
        if (autoFix) corrected.happiness = GAME_CONSTANTS.INITIAL_FAN_HAPPINESS;
    } else if (fanData.happiness < 0 || fanData.happiness > 100) {
        errors.push('Fan happiness must be between 0 and 100');
        if (autoFix) corrected.happiness = Math.max(0, Math.min(100, fanData.happiness));
    }

    // Validate ticket prices
    if (typeof fanData.seasonTicketPrice !== 'number' || !isFinite(fanData.seasonTicketPrice)) {
        errors.push('Season ticket price must be a valid number');
        if (autoFix) corrected.seasonTicketPrice = GAME_CONSTANTS.SEASON_TICKET_PRICE_DEFAULT;
    } else if (fanData.seasonTicketPrice < 0 || fanData.seasonTicketPrice > 1000) {
        errors.push('Season ticket price must be between 0 and 1000');
        if (autoFix) {
            corrected.seasonTicketPrice = Math.max(0, Math.min(1000, fanData.seasonTicketPrice));
        }
    }

    if (typeof fanData.matchdayTicketPrice !== 'number' || !isFinite(fanData.matchdayTicketPrice)) {
        errors.push('Matchday ticket price must be a valid number');
        if (autoFix) corrected.matchdayTicketPrice = GAME_CONSTANTS.MATCHDAY_TICKET_PRICE_DEFAULT;
    } else if (fanData.matchdayTicketPrice < 0 || fanData.matchdayTicketPrice > 500) {
        errors.push('Matchday ticket price must be between 0 and 500');
        if (autoFix) {
            corrected.matchdayTicketPrice = Math.max(0, Math.min(500, fanData.matchdayTicketPrice));
        }
    }

    // Validate season tickets sold
    if (!Number.isInteger(fanData.seasonTicketsSold)) {
        errors.push('Season tickets sold must be an integer');
        if (autoFix) corrected.seasonTicketsSold = 0;
    } else if (fanData.seasonTicketsSold < 0) {
        errors.push('Season tickets sold cannot be negative');
        if (autoFix) corrected.seasonTicketsSold = 0;
    } else if (fanData.seasonTicketsSold > fanData.maxSeasonTickets) {
        errors.push('Season tickets sold cannot exceed maximum');
        if (autoFix) corrected.seasonTicketsSold = fanData.maxSeasonTickets;
    }

    // Validate max season tickets
    if (!Number.isInteger(fanData.maxSeasonTickets)) {
        errors.push('Max season tickets must be an integer');
        if (autoFix) corrected.maxSeasonTickets = GAME_CONSTANTS.MAX_SEASON_TICKETS;
    } else if (fanData.maxSeasonTickets < 0) {
        errors.push('Max season tickets cannot be negative');
        if (autoFix) corrected.maxSeasonTickets = GAME_CONSTANTS.MAX_SEASON_TICKETS;
    }

    return { valid: errors.length === 0, errors, warnings, corrected };
}

/**
 * Validate season and matchday data
 * @param {Object} gameState - Game state object
 * @param {boolean} autoFix - Whether to auto-fix
 * @returns {IntegrityResult}
 */
export function validateSeasonData(gameState, autoFix = false) {
    const errors = [];
    const warnings = [];
    const corrected = {};

    // Validate current season
    if (!Number.isInteger(gameState.currentSeason)) {
        errors.push('Current season must be an integer');
        if (autoFix) corrected.currentSeason = 1;
    } else if (gameState.currentSeason < 1) {
        errors.push('Current season must be at least 1');
        if (autoFix) corrected.currentSeason = 1;
    } else if (gameState.currentSeason > 999) {
        warnings.push('Current season is very high');
    }

    // Validate current matchday
    if (!Number.isInteger(gameState.currentMatchday)) {
        errors.push('Current matchday must be an integer');
        if (autoFix) corrected.currentMatchday = 1;
    } else if (gameState.currentMatchday < 1) {
        errors.push('Current matchday must be at least 1');
        if (autoFix) corrected.currentMatchday = 1;
    } else if (gameState.currentMatchday > 50) {
        errors.push('Current matchday exceeds reasonable limit');
        if (autoFix) corrected.currentMatchday = 1;
    }

    // Validate pre-season flag
    if (typeof gameState.isPreSeason !== 'boolean') {
        errors.push('isPreSeason must be a boolean');
        if (autoFix) corrected.isPreSeason = false;
    }

    // Validate league table
    if (!Array.isArray(gameState.leagueTable)) {
        errors.push('League table must be an array');
        if (autoFix) corrected.leagueTable = [];
    } else if (gameState.leagueTable.length !== 8 && gameState.leagueTable.length !== 0) {
        warnings.push(`League table should have 8 teams, has ${gameState.leagueTable.length}`);
    }

    // Validate fixtures
    if (!Array.isArray(gameState.fixtures)) {
        errors.push('Fixtures must be an array');
        if (autoFix) corrected.fixtures = [];
    }

    return { valid: errors.length === 0, errors, warnings, corrected };
}

/**
 * Validate relationships between different parts of game state
 * @param {Object} gameState - Game state object
 * @returns {IntegrityResult}
 */
export function validateRelationships(gameState) {
    const errors = [];
    const warnings = [];

    // Check if season tickets sold value is reasonable given stadium capacity
    if (gameState.clubData && gameState.fanData) {
        const { stadiumCapacity } = gameState.clubData;
        const { seasonTicketsSold, maxSeasonTickets } = gameState.fanData;

        if (seasonTicketsSold > stadiumCapacity) {
            errors.push('Season tickets sold exceeds stadium capacity');
        }

        if (maxSeasonTickets > stadiumCapacity) {
            warnings.push('Max season tickets exceeds stadium capacity');
        }
    }

    // Check if club can afford weekly wages
    if (gameState.clubData) {
        const { finances, weeklyWages } = gameState.clubData;

        if (finances < weeklyWages * 4) {
            warnings.push('Club may not be able to afford wages for much longer');
        }
    }

    // Check if reputation aligns with performance
    if (gameState.managerData && gameState.leagueTable && gameState.leagueTable.length > 0) {
        const playerTeam = gameState.leagueTable.find(team => team.isPlayer);

        if (playerTeam) {
            const position = gameState.leagueTable.indexOf(playerTeam) + 1;
            const reputation = gameState.managerData.reputation;

            // High reputation but low position
            if (reputation > 80 && position > 6) {
                warnings.push('High reputation but poor league position');
            }

            // Low reputation but high position
            if (reputation < 20 && position <= 2) {
                warnings.push('Low reputation but good league position');
            }
        }
    }

    // Check financial history
    if (gameState.financialHistory) {
        if (!Array.isArray(gameState.financialHistory.weeklyExpenses)) {
            errors.push('Financial history weeklyExpenses must be an array');
        }

        if (typeof gameState.financialHistory.seasonRevenue !== 'number') {
            errors.push('Financial history seasonRevenue must be a number');
        }
    }

    return { valid: errors.length === 0, errors, warnings, corrected: null };
}

/**
 * Check for signs of cheating or manipulation
 * @param {Object} gameState - Game state object
 * @returns {Object} Cheat detection result
 */
export function detectCheating(gameState) {
    const suspiciousActivities = [];
    let cheatScore = 0;

    // Check for impossibly high values
    if (gameState.managerData?.wealth > 50000000) {
        suspiciousActivities.push('Manager wealth is extremely high');
        cheatScore += 3;
    }

    if (gameState.clubData?.finances > 500000000) {
        suspiciousActivities.push('Club finances are extremely high');
        cheatScore += 3;
    }

    // Check for max level everything
    if (gameState.clubData) {
        const { trainingLevel, academyLevel, stadiumLevel } = gameState.clubData;
        if (trainingLevel === 10 && academyLevel === 10 && stadiumLevel === 10) {
            if (gameState.currentSeason < 5) {
                suspiciousActivities.push('All facilities maxed out too early');
                cheatScore += 2;
            }
        }
    }

    // Check for perfect stats
    if (gameState.managerData) {
        const { reputation, jobSecurity } = gameState.managerData;
        if (reputation === 100 && jobSecurity === 100) {
            suspiciousActivities.push('Perfect manager stats');
            cheatScore += 1;
        }
    }

    // Check for unrealistic win rate
    if (gameState.leagueTable && gameState.leagueTable.length > 0) {
        const playerTeam = gameState.leagueTable.find(team => team.isPlayer);
        if (playerTeam && playerTeam.played > 0) {
            const winRate = (playerTeam.won / playerTeam.played) * 100;
            if (winRate === 100 && playerTeam.played > 10) {
                suspiciousActivities.push('Perfect win rate over many matches');
                cheatScore += 2;
            }
        }
    }

    return {
        suspicious: cheatScore > 3,
        cheatScore,
        activities: suspiciousActivities,
        verdict: cheatScore > 5 ? 'Highly suspicious' : cheatScore > 3 ? 'Suspicious' : 'Normal'
    };
}

/**
 * Quick validation check (returns boolean only)
 * @param {Object} gameState - Game state object
 * @returns {boolean} Whether state is valid
 */
export function isValidGameState(gameState) {
    const result = validateGameState(gameState, false);
    return result.valid;
}
