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
