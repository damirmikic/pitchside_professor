/**
 * Input Validation Utility
 * Provides validation functions for all user inputs to prevent invalid data
 */

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the input is valid
 * @property {string} error - Error message if invalid
 * @property {*} sanitized - Sanitized/coerced value
 */

/**
 * Validate numeric input within a range
 * @param {*} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {ValidationResult}
 */
export function validateNumber(value, min, max, fieldName = 'Value') {
    // Check if it's a number
    const num = Number(value);

    if (isNaN(num)) {
        return {
            valid: false,
            error: `${fieldName} must be a valid number`,
            sanitized: null
        };
    }

    // Check if it's finite
    if (!isFinite(num)) {
        return {
            valid: false,
            error: `${fieldName} must be a finite number`,
            sanitized: null
        };
    }

    // Check range
    if (num < min || num > max) {
        return {
            valid: false,
            error: `${fieldName} must be between ${min} and ${max}`,
            sanitized: null
        };
    }

    return {
        valid: true,
        error: null,
        sanitized: num
    };
}

/**
 * Validate integer input within a range
 * @param {*} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validateInteger(value, min, max, fieldName = 'Value') {
    const numResult = validateNumber(value, min, max, fieldName);

    if (!numResult.valid) {
        return numResult;
    }

    const int = Math.floor(numResult.sanitized);

    if (int !== numResult.sanitized) {
        return {
            valid: false,
            error: `${fieldName} must be a whole number`,
            sanitized: int
        };
    }

    return {
        valid: true,
        error: null,
        sanitized: int
    };
}

/**
 * Validate positive number
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validatePositive(value, fieldName = 'Value') {
    return validateNumber(value, 0, Number.MAX_SAFE_INTEGER, fieldName);
}

/**
 * Validate percentage (0-100)
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validatePercentage(value, fieldName = 'Value') {
    return validateNumber(value, 0, 100, fieldName);
}

/**
 * Validate ticket price
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateTicketPrice(value) {
    const result = validateNumber(value, 0, 500, 'Ticket price');

    if (result.valid && result.sanitized < 1) {
        return {
            valid: false,
            error: 'Ticket price must be at least $1',
            sanitized: 1
        };
    }

    return result;
}

/**
 * Validate financial amount
 * @param {*} value - Value to validate
 * @param {number} max - Maximum allowed amount
 * @returns {ValidationResult}
 */
export function validateFinancialAmount(value, max = Number.MAX_SAFE_INTEGER) {
    const result = validateNumber(value, 0, max, 'Amount');

    if (result.valid) {
        // Round to nearest cent
        result.sanitized = Math.round(result.sanitized * 100) / 100;
    }

    return result;
}

/**
 * Validate string input
 * @param {*} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validateString(value, minLength = 0, maxLength = 255, fieldName = 'Value') {
    if (typeof value !== 'string') {
        return {
            valid: false,
            error: `${fieldName} must be a string`,
            sanitized: String(value)
        };
    }

    const trimmed = value.trim();

    if (trimmed.length < minLength) {
        return {
            valid: false,
            error: `${fieldName} must be at least ${minLength} characters`,
            sanitized: trimmed
        };
    }

    if (trimmed.length > maxLength) {
        return {
            valid: false,
            error: `${fieldName} must be no more than ${maxLength} characters`,
            sanitized: trimmed.substring(0, maxLength)
        };
    }

    return {
        valid: true,
        error: null,
        sanitized: trimmed
    };
}

/**
 * Validate team name
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateTeamName(value) {
    const result = validateString(value, 3, 50, 'Team name');

    if (result.valid) {
        // Check for valid characters (letters, numbers, spaces, hyphens)
        const validPattern = /^[a-zA-Z0-9\s\-']+$/;
        if (!validPattern.test(result.sanitized)) {
            return {
                valid: false,
                error: 'Team name contains invalid characters',
                sanitized: result.sanitized.replace(/[^a-zA-Z0-9\s\-']/g, '')
            };
        }
    }

    return result;
}

/**
 * Validate enum/choice value
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validateChoice(value, allowedValues, fieldName = 'Value') {
    if (!allowedValues.includes(value)) {
        return {
            valid: false,
            error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
            sanitized: allowedValues[0]
        };
    }

    return {
        valid: true,
        error: null,
        sanitized: value
    };
}

/**
 * Validate boolean
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validateBoolean(value, fieldName = 'Value') {
    if (typeof value === 'boolean') {
        return {
            valid: true,
            error: null,
            sanitized: value
        };
    }

    // Try to coerce
    const coerced = Boolean(value);

    return {
        valid: true,
        error: null,
        sanitized: coerced
    };
}

/**
 * Validate array
 * @param {*} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validateArray(value, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, fieldName = 'Value') {
    if (!Array.isArray(value)) {
        return {
            valid: false,
            error: `${fieldName} must be an array`,
            sanitized: []
        };
    }

    if (value.length < minLength) {
        return {
            valid: false,
            error: `${fieldName} must have at least ${minLength} items`,
            sanitized: value
        };
    }

    if (value.length > maxLength) {
        return {
            valid: false,
            error: `${fieldName} must have no more than ${maxLength} items`,
            sanitized: value.slice(0, maxLength)
        };
    }

    return {
        valid: true,
        error: null,
        sanitized: value
    };
}

/**
 * Validate object has required keys
 * @param {*} value - Value to validate
 * @param {Array<string>} requiredKeys - Required keys
 * @param {string} fieldName - Name of the field
 * @returns {ValidationResult}
 */
export function validateObject(value, requiredKeys = [], fieldName = 'Value') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return {
            valid: false,
            error: `${fieldName} must be an object`,
            sanitized: {}
        };
    }

    const missingKeys = requiredKeys.filter(key => !(key in value));

    if (missingKeys.length > 0) {
        return {
            valid: false,
            error: `${fieldName} is missing required keys: ${missingKeys.join(', ')}`,
            sanitized: value
        };
    }

    return {
        valid: true,
        error: null,
        sanitized: value
    };
}

/**
 * Game-specific validators
 */

/**
 * Validate club strength
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateClubStrength(value) {
    return validateInteger(value, 1, 100, 'Club strength');
}

/**
 * Validate reputation
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateReputation(value) {
    return validateInteger(value, 0, 100, 'Reputation');
}

/**
 * Validate job security
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateJobSecurity(value) {
    return validateInteger(value, 0, 100, 'Job security');
}

/**
 * Validate fan happiness
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateFanHappiness(value) {
    return validateInteger(value, 0, 100, 'Fan happiness');
}

/**
 * Validate season number
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateSeason(value) {
    return validateInteger(value, 1, 999, 'Season');
}

/**
 * Validate matchday number
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateMatchday(value) {
    return validateInteger(value, 1, 50, 'Matchday');
}

/**
 * Validate stadium capacity
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateStadiumCapacity(value) {
    return validateInteger(value, 100, 100000, 'Stadium capacity');
}

/**
 * Validate upgrade level
 * @param {*} value - Value to validate
 * @returns {ValidationResult}
 */
export function validateUpgradeLevel(value) {
    return validateInteger(value, 1, 10, 'Upgrade level');
}

/**
 * Batch validate multiple fields
 * @param {Object} data - Object with fields to validate
 * @param {Object} validationRules - Object mapping field names to validation functions
 * @returns {Object} Validation results
 */
export function validateBatch(data, validationRules) {
    const results = {};
    const errors = [];
    const sanitized = {};

    for (const [field, validator] of Object.entries(validationRules)) {
        if (!(field in data)) {
            errors.push(`Missing field: ${field}`);
            results[field] = { valid: false, error: 'Missing field' };
            continue;
        }

        const result = validator(data[field]);
        results[field] = result;

        if (!result.valid) {
            errors.push(`${field}: ${result.error}`);
        } else {
            sanitized[field] = result.sanitized;
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        results,
        sanitized
    };
}

/**
 * Create a validator that allows null/undefined
 * @param {Function} validator - Base validator function
 * @returns {Function} Optional validator
 */
export function optional(validator) {
    return (value) => {
        if (value === null || value === undefined) {
            return {
                valid: true,
                error: null,
                sanitized: value
            };
        }
        return validator(value);
    };
}
