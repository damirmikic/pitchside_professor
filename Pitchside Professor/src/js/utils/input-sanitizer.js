/**
 * Input Sanitization Utility
 * Provides sanitization functions to prevent XSS and other injection attacks
 */

/**
 * HTML entity map for escaping
 */
const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') {
        return String(str);
    }

    return str.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Sanitize text input by escaping HTML
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeText(input) {
    if (typeof input !== 'string') {
        input = String(input);
    }

    // Trim whitespace
    let sanitized = input.trim();

    // Escape HTML entities
    sanitized = escapeHtml(sanitized);

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    return sanitized;
}

/**
 * Sanitize HTML content while preserving specific safe tags
 * @param {string} html - HTML content to sanitize
 * @param {Array<string>} allowedTags - Array of allowed HTML tags (default: none)
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html, allowedTags = []) {
    if (typeof html !== 'string') {
        return '';
    }

    if (allowedTags.length === 0) {
        // No tags allowed, escape everything
        return escapeHtml(html);
    }

    // Create a temporary DOM element
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Recursively sanitize
    const sanitizeNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            if (allowedTags.includes(tagName)) {
                let result = `<${tagName}>`;
                for (const child of node.childNodes) {
                    result += sanitizeNode(child);
                }
                result += `</${tagName}>`;
                return result;
            } else {
                // Tag not allowed, keep only text content
                let result = '';
                for (const child of node.childNodes) {
                    result += sanitizeNode(child);
                }
                return result;
            }
        }

        return '';
    };

    let result = '';
    for (const child of temp.childNodes) {
        result += sanitizeNode(child);
    }

    return result;
}

/**
 * Sanitize numeric input
 * @param {*} input - Input to sanitize
 * @returns {number|null} Sanitized number or null
 */
export function sanitizeNumber(input) {
    const num = Number(input);

    if (isNaN(num) || !isFinite(num)) {
        return null;
    }

    return num;
}

/**
 * Sanitize integer input
 * @param {*} input - Input to sanitize
 * @returns {number|null} Sanitized integer or null
 */
export function sanitizeInteger(input) {
    const num = sanitizeNumber(input);

    if (num === null) {
        return null;
    }

    return Math.floor(num);
}

/**
 * Sanitize filename to prevent directory traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
        filename = String(filename);
    }

    // Remove directory traversal attempts
    let sanitized = filename.replace(/\.\./g, '');

    // Remove path separators
    sanitized = sanitized.replace(/[\/\\]/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Allow only alphanumeric, underscore, hyphen, and dot
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Limit length
    if (sanitized.length > 255) {
        sanitized = sanitized.substring(0, 255);
    }

    return sanitized || 'unnamed';
}

/**
 * Sanitize URL to prevent XSS through javascript: protocol
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or empty string
 */
export function sanitizeUrl(url) {
    if (typeof url !== 'string') {
        return '';
    }

    // Trim whitespace
    url = url.trim();

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = url.toLowerCase();

    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            console.warn('Blocked potentially dangerous URL:', url);
            return '';
        }
    }

    // Only allow http, https, and relative URLs
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#')) {
        return url;
    }

    // Assume relative URL
    return url;
}

/**
 * Sanitize CSS to prevent CSS injection
 * @param {string} css - CSS string to sanitize
 * @returns {string} Sanitized CSS
 */
export function sanitizeCss(css) {
    if (typeof css !== 'string') {
        return '';
    }

    // Remove potentially dangerous CSS
    let sanitized = css;

    // Remove import statements
    sanitized = sanitized.replace(/@import/gi, '');

    // Remove expression() (IE specific XSS)
    sanitized = sanitized.replace(/expression\s*\(/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove behavior property (IE specific)
    sanitized = sanitized.replace(/behavior\s*:/gi, '');

    return sanitized;
}

/**
 * Sanitize JSON string to prevent injection
 * @param {string} jsonString - JSON string to sanitize
 * @returns {Object|null} Parsed and sanitized object or null
 */
export function sanitizeJson(jsonString) {
    try {
        // Parse the JSON
        const parsed = JSON.parse(jsonString);

        // Re-stringify to ensure it's valid JSON
        const sanitized = JSON.parse(JSON.stringify(parsed));

        return sanitized;
    } catch (error) {
        console.error('Invalid JSON:', error);
        return null;
    }
}

/**
 * Sanitize object by escaping all string values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeText(key);

        if (typeof value === 'string') {
            sanitized[sanitizedKey] = sanitizeText(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[sanitizedKey] = sanitizeObject(value);
        } else {
            sanitized[sanitizedKey] = value;
        }
    }

    return sanitized;
}

/**
 * Strip all HTML tags from a string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
    if (typeof html !== 'string') {
        return '';
    }

    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

/**
 * Sanitize user input for display in the UI
 * This is the main function to use for user-generated content
 * @param {string} input - User input
 * @returns {string} Sanitized input safe for display
 */
export function sanitizeForDisplay(input) {
    if (typeof input !== 'string') {
        input = String(input);
    }

    // Strip any existing HTML tags
    let sanitized = stripHtml(input);

    // Escape HTML entities
    sanitized = escapeHtml(sanitized);

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
}

/**
 * Sanitize team name for safe storage and display
 * @param {string} teamName - Team name to sanitize
 * @returns {string} Sanitized team name
 */
export function sanitizeTeamName(teamName) {
    let sanitized = sanitizeForDisplay(teamName);

    // Allow only letters, numbers, spaces, hyphens, and apostrophes
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-']/g, '');

    // Limit length
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized || 'Unknown Team';
}

/**
 * Create a safe innerHTML setter that sanitizes content
 * @param {HTMLElement} element - DOM element
 * @param {string} html - HTML content
 * @param {Array<string>} allowedTags - Allowed HTML tags
 */
export function safeSetInnerHTML(element, html, allowedTags = []) {
    if (!(element instanceof HTMLElement)) {
        console.error('Invalid element provided');
        return;
    }

    const sanitized = sanitizeHtml(html, allowedTags);
    element.innerHTML = sanitized;
}

/**
 * Create a safe text content setter
 * @param {HTMLElement} element - DOM element
 * @param {string} text - Text content
 */
export function safeSetTextContent(element, text) {
    if (!(element instanceof HTMLElement)) {
        console.error('Invalid element provided');
        return;
    }

    // textContent is safe by default, but we sanitize anyway
    element.textContent = sanitizeText(text);
}

/**
 * Sanitize attribute value for safe usage in HTML attributes
 * @param {string} value - Attribute value
 * @returns {string} Sanitized value
 */
export function sanitizeAttribute(value) {
    if (typeof value !== 'string') {
        value = String(value);
    }

    // Escape quotes and angle brackets
    return value
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Batch sanitize multiple inputs
 * @param {Object} inputs - Object with key-value pairs to sanitize
 * @param {Object} sanitizers - Object mapping keys to sanitizer functions
 * @returns {Object} Sanitized inputs
 */
export function sanitizeBatch(inputs, sanitizers = {}) {
    const sanitized = {};

    for (const [key, value] of Object.entries(inputs)) {
        const sanitizer = sanitizers[key] || sanitizeText;
        sanitized[key] = sanitizer(value);
    }

    return sanitized;
}
