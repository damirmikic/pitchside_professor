/**
 * Game State Manager
 * Centralized state management for the game
 */

import { GAME_CONSTANTS } from '../data/constants.js';
import { leagues } from '../data/leagues.js';

class GameState {
    constructor() {
        this.currentSeason = 1;
        this.currentMatchday = 1;
        this.playerTeamData = null;
        this.isPreSeason = true;
        this.selectedLeague = null;
        this.selectedTeam = null;
        this.leagues = leagues; // Store leagues reference

        this.leagueTable = [];
        this.fixtures = [];

        this.managerData = {
            wealth: GAME_CONSTANTS.INITIAL_MANAGER_WEALTH,
            reputation: GAME_CONSTANTS.INITIAL_MANAGER_REPUTATION,
            jobSecurity: GAME_CONSTANTS.INITIAL_JOB_SECURITY,
            lifestyle: []
        };

        this.clubData = {
            finances: GAME_CONSTANTS.INITIAL_CLUB_FINANCES,
            strength: GAME_CONSTANTS.INITIAL_CLUB_STRENGTH,
            trainingLevel: 1,
            academyLevel: 1,
            stadiumLevel: GAME_CONSTANTS.STADIUM_INITIAL_LEVEL,
            stadiumCapacity: GAME_CONSTANTS.STADIUM_CAPACITY_MIN +
                Math.floor(Math.random() * (GAME_CONSTANTS.STADIUM_CAPACITY_MAX - GAME_CONSTANTS.STADIUM_CAPACITY_MIN)),
            sponsorship: null,
            weeklyWages: GAME_CONSTANTS.WEEKLY_WAGES,
            transferBudget: GAME_CONSTANTS.INITIAL_TRANSFER_BUDGET,
            seasonTicketRevenue: 0,
            matchdayRevenue: 0,
            tvRevenue: 0,
            sponsorshipOffers: []
        };

        this.fanData = {
            happiness: GAME_CONSTANTS.INITIAL_FAN_HAPPINESS,
            seasonTicketPrice: GAME_CONSTANTS.SEASON_TICKET_PRICE_DEFAULT,
            matchdayTicketPrice: GAME_CONSTANTS.MATCHDAY_TICKET_PRICE_DEFAULT,
            seasonTicketsSold: 0,
            maxSeasonTickets: GAME_CONSTANTS.MAX_SEASON_TICKETS
        };

        this.preSeasonData = {
            daysLeft: GAME_CONSTANTS.PRESEASON_DAYS,
            matchesPlayed: 0,
            maxMatches: GAME_CONSTANTS.PRESEASON_MAX_MATCHES,
            teamFitness: GAME_CONSTANTS.PRESEASON_INITIAL_FITNESS,
            teamChemistry: GAME_CONSTANTS.PRESEASON_INITIAL_CHEMISTRY,
            seasonTicketsSoldToday: 0,
            scheduledMatches: [],
            nextMatchDay: null
        };

        this.financialHistory = {
            weeklyExpenses: [],
            seasonRevenue: 0,
            lastWagePayment: 0
        };

        // Metadata for save file tracking
        this.saveMetadata = {
            version: '1.0.0',
            lastSaved: null,
            saveCount: 0
        };
    }

    loadFromLocalStorage() {
        this.selectedLeague = localStorage.getItem('selectedLeague');
        this.selectedTeam = localStorage.getItem('selectedTeam');
    }

    reset() {
        this.currentSeason = 1;
        this.currentMatchday = 1;
        this.isPreSeason = true;
        this.leagueTable = [];
        this.fixtures = [];
    }

    /**
     * Serialize the current game state to a JSON-compatible object
     * @returns {Object} Serialized game state
     */
    serializeState() {
        return {
            version: this.saveMetadata.version,
            timestamp: new Date().toISOString(),
            gameData: {
                currentSeason: this.currentSeason,
                currentMatchday: this.currentMatchday,
                isPreSeason: this.isPreSeason,
                selectedLeague: this.selectedLeague,
                selectedTeam: this.selectedTeam,
                playerTeamData: this.playerTeamData,
                leagueTable: this.leagueTable,
                fixtures: this.fixtures,
                managerData: { ...this.managerData },
                clubData: { ...this.clubData },
                fanData: { ...this.fanData },
                preSeasonData: { ...this.preSeasonData },
                financialHistory: {
                    weeklyExpenses: [...this.financialHistory.weeklyExpenses],
                    seasonRevenue: this.financialHistory.seasonRevenue,
                    lastWagePayment: this.financialHistory.lastWagePayment
                }
            }
        };
    }

    /**
     * Deserialize and restore game state from a saved object
     * @param {Object} savedState - Saved game state object
     * @returns {boolean} Success status
     */
    deserializeState(savedState) {
        try {
            if (!savedState || !savedState.gameData) {
                throw new Error('Invalid save data format');
            }

            const data = savedState.gameData;

            // Restore all game state
            this.currentSeason = data.currentSeason || 1;
            this.currentMatchday = data.currentMatchday || 1;
            this.isPreSeason = data.isPreSeason !== undefined ? data.isPreSeason : true;
            this.selectedLeague = data.selectedLeague;
            this.selectedTeam = data.selectedTeam;
            this.playerTeamData = data.playerTeamData;
            this.leagueTable = data.leagueTable || [];
            this.fixtures = data.fixtures || [];

            // Restore manager data
            if (data.managerData) {
                this.managerData = { ...data.managerData };
            }

            // Restore club data
            if (data.clubData) {
                this.clubData = { ...data.clubData };
            }

            // Restore fan data
            if (data.fanData) {
                this.fanData = { ...data.fanData };
            }

            // Restore pre-season data
            if (data.preSeasonData) {
                this.preSeasonData = { ...data.preSeasonData };
            }

            // Restore financial history
            if (data.financialHistory) {
                this.financialHistory = {
                    weeklyExpenses: [...(data.financialHistory.weeklyExpenses || [])],
                    seasonRevenue: data.financialHistory.seasonRevenue || 0,
                    lastWagePayment: data.financialHistory.lastWagePayment || 0
                };
            }

            return true;
        } catch (error) {
            console.error('Error deserializing game state:', error);
            return false;
        }
    }

    /**
     * Save the complete game state to localStorage
     * @param {string} slotName - Save slot identifier (default: 'autosave')
     * @returns {boolean} Success status
     */
    saveToLocalStorage(slotName = 'autosave') {
        try {
            const saveData = this.serializeState();
            saveData.slotName = slotName;

            // Update metadata
            this.saveMetadata.lastSaved = new Date().toISOString();
            this.saveMetadata.saveCount++;
            saveData.metadata = { ...this.saveMetadata };

            const saveKey = `pitchside_save_${slotName}`;
            localStorage.setItem(saveKey, JSON.stringify(saveData));

            // Also update the quick load reference
            localStorage.setItem('selectedLeague', this.selectedLeague || '');
            localStorage.setItem('selectedTeam', this.selectedTeam || '');
            localStorage.setItem('pitchside_last_save', slotName);

            console.log(`Game saved successfully to slot: ${slotName}`);
            return true;
        } catch (error) {
            console.error('Error saving game state:', error);
            return false;
        }
    }

    /**
     * Load the complete game state from localStorage
     * @param {string} slotName - Save slot identifier (default: 'autosave')
     * @returns {boolean} Success status
     */
    loadFullGameState(slotName = 'autosave') {
        try {
            const saveKey = `pitchside_save_${slotName}`;
            const savedData = localStorage.getItem(saveKey);

            if (!savedData) {
                console.warn(`No save data found for slot: ${slotName}`);
                return false;
            }

            const parsedData = JSON.parse(savedData);

            // Restore metadata
            if (parsedData.metadata) {
                this.saveMetadata = { ...parsedData.metadata };
            }

            const success = this.deserializeState(parsedData);

            if (success) {
                console.log(`Game loaded successfully from slot: ${slotName}`);
            }

            return success;
        } catch (error) {
            console.error('Error loading game state:', error);
            return false;
        }
    }

    /**
     * Export game state as a downloadable JSON file
     * @returns {string} JSON string of game state
     */
    exportGameState() {
        try {
            const saveData = this.serializeState();
            saveData.exportedAt = new Date().toISOString();
            saveData.gameTitle = `${this.selectedTeam || 'Unknown'} - Season ${this.currentSeason}`;

            return JSON.stringify(saveData, null, 2);
        } catch (error) {
            console.error('Error exporting game state:', error);
            return null;
        }
    }

    /**
     * Import game state from a JSON string
     * @param {string} jsonString - JSON string containing save data
     * @returns {boolean} Success status
     */
    importGameState(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);

            // Validate the imported data has the required structure
            if (!importedData.gameData) {
                throw new Error('Invalid save file format');
            }

            const success = this.deserializeState(importedData);

            if (success) {
                console.log('Game state imported successfully');
                // Save to autosave after successful import
                this.saveToLocalStorage('imported_save');
            }

            return success;
        } catch (error) {
            console.error('Error importing game state:', error);
            return false;
        }
    }

    /**
     * Get a list of all available save slots
     * @returns {Array} Array of save slot information
     */
    getSaveSlots() {
        const slots = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key && key.startsWith('pitchside_save_')) {
                try {
                    const saveData = JSON.parse(localStorage.getItem(key));
                    const slotName = key.replace('pitchside_save_', '');

                    slots.push({
                        slotName,
                        timestamp: saveData.timestamp,
                        season: saveData.gameData?.currentSeason || 'Unknown',
                        team: saveData.gameData?.selectedTeam || 'Unknown',
                        league: saveData.gameData?.selectedLeague || 'Unknown'
                    });
                } catch (error) {
                    console.warn(`Could not parse save slot: ${key}`);
                }
            }
        }

        return slots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Delete a specific save slot
     * @param {string} slotName - Save slot identifier
     * @returns {boolean} Success status
     */
    deleteSaveSlot(slotName) {
        try {
            const saveKey = `pitchside_save_${slotName}`;
            localStorage.removeItem(saveKey);
            console.log(`Save slot deleted: ${slotName}`);
            return true;
        } catch (error) {
            console.error('Error deleting save slot:', error);
            return false;
        }
    }

    /**
     * Clear all save data
     * @returns {boolean} Success status
     */
    clearAllSaves() {
        try {
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('pitchside_')) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared ${keysToRemove.length} save slots`);
            return true;
        } catch (error) {
            console.error('Error clearing saves:', error);
            return false;
        }
    }

    /**
     * Auto-save the game (to be called after significant events)
     */
    autoSave() {
        return this.saveToLocalStorage('autosave');
    }
}

// Singleton instance
export const gameState = new GameState();
