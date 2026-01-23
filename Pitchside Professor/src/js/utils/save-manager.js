/**
 * Save Manager Utility
 * Handles save file export/import operations and download/upload
 */

import { gameState } from '../core/state-manager.js';

/**
 * Download game state as a JSON file
 * @param {string} filename - Optional custom filename
 */
export function downloadSaveFile(filename = null) {
    try {
        const jsonData = gameState.exportGameState();

        if (!jsonData) {
            throw new Error('Failed to export game state');
        }

        // Generate filename if not provided
        if (!filename) {
            const teamName = gameState.selectedTeam || 'Unknown';
            const season = gameState.currentSeason || 1;
            const timestamp = new Date().toISOString().split('T')[0];
            filename = `pitchside_${sanitizeFilename(teamName)}_S${season}_${timestamp}.json`;
        }

        // Create blob and download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Save file downloaded successfully');
        return true;
    } catch (error) {
        console.error('Error downloading save file:', error);
        return false;
    }
}

/**
 * Trigger file upload dialog and load save file
 * @param {Function} onSuccess - Callback function on successful import
 * @param {Function} onError - Callback function on error
 */
export function uploadSaveFile(onSuccess, onError) {
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const success = gameState.importGameState(text);

            if (success) {
                console.log('Save file loaded successfully');
                if (onSuccess) onSuccess(file.name);
            } else {
                throw new Error('Failed to import save data');
            }
        } catch (error) {
            console.error('Error uploading save file:', error);
            if (onError) onError(error);
        } finally {
            document.body.removeChild(fileInput);
        }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
}

/**
 * Quick save to a named slot
 * @param {string} slotName - Name of the save slot
 * @returns {boolean} Success status
 */
export function quickSave(slotName = 'quicksave') {
    return gameState.saveToLocalStorage(slotName);
}

/**
 * Quick load from a named slot
 * @param {string} slotName - Name of the save slot
 * @returns {boolean} Success status
 */
export function quickLoad(slotName = 'quicksave') {
    return gameState.loadFullGameState(slotName);
}

/**
 * Create a manual save with a custom name
 * @param {string} saveName - Custom save name
 * @returns {boolean} Success status
 */
export function createManualSave(saveName) {
    if (!saveName || saveName.trim() === '') {
        console.error('Save name cannot be empty');
        return false;
    }

    const sanitized = sanitizeFilename(saveName);
    return gameState.saveToLocalStorage(`manual_${sanitized}`);
}

/**
 * Get formatted list of all save slots for UI display
 * @returns {Array} Formatted save slot data
 */
export function getFormattedSaveSlots() {
    const slots = gameState.getSaveSlots();

    return slots.map(slot => {
        const date = new Date(slot.timestamp);
        const formattedDate = date.toLocaleString();

        return {
            ...slot,
            displayName: formatSaveDisplayName(slot),
            formattedDate,
            isAutosave: slot.slotName === 'autosave',
            isQuicksave: slot.slotName === 'quicksave'
        };
    });
}

/**
 * Format save slot name for display
 * @param {Object} slot - Save slot data
 * @returns {string} Formatted display name
 */
function formatSaveDisplayName(slot) {
    if (slot.slotName === 'autosave') return '🔄 Autosave';
    if (slot.slotName === 'quicksave') return '⚡ Quicksave';
    if (slot.slotName.startsWith('manual_')) {
        return `💾 ${slot.slotName.replace('manual_', '')}`;
    }
    return slot.slotName;
}

/**
 * Sanitize filename for safe file system usage
 * @param {string} name - Filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(name) {
    return name
        .replace(/[^a-z0-9_-]/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}

/**
 * Check if save data exists in localStorage
 * @param {string} slotName - Save slot identifier
 * @returns {boolean} Whether save exists
 */
export function saveExists(slotName) {
    const saveKey = `pitchside_save_${slotName}`;
    return localStorage.getItem(saveKey) !== null;
}

/**
 * Get save file size information
 * @returns {Object} Storage usage information
 */
export function getStorageInfo() {
    let totalSize = 0;
    const saveSlots = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith('pitchside_')) {
            const value = localStorage.getItem(key);
            const size = new Blob([value]).size;
            totalSize += size;

            if (key.startsWith('pitchside_save_')) {
                saveSlots.push({
                    key,
                    size,
                    sizeKB: (size / 1024).toFixed(2)
                });
            }
        }
    }

    return {
        totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        saveCount: saveSlots.length,
        saves: saveSlots
    };
}

/**
 * Validate save file before import
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} Validation result
 */
export function validateSaveFile(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        // Check for required fields
        if (!data.gameData) {
            return { valid: false, error: 'Missing gameData field' };
        }

        if (!data.version) {
            return { valid: false, error: 'Missing version field' };
        }

        // Check for essential game data
        const required = ['currentSeason', 'selectedLeague', 'selectedTeam'];
        for (const field of required) {
            if (!(field in data.gameData)) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }

        return { valid: true, data };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}
