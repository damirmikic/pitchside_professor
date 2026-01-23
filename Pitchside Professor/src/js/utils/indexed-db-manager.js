/**
 * IndexedDB Storage Manager
 * Provides persistent storage using IndexedDB for larger data volumes
 * Useful for match history, statistics, and extended game data
 */

const DB_NAME = 'PitchsideProfessorDB';
const DB_VERSION = 1;

// Store names
const STORES = {
    SAVES: 'saves',
    MATCH_HISTORY: 'match_history',
    STATISTICS: 'statistics',
    BACKUPS: 'backups'
};

/**
 * IndexedDB Manager Class
 */
class IndexedDBManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the IndexedDB database
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('IndexedDB initialized successfully');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create saves store
                if (!db.objectStoreNames.contains(STORES.SAVES)) {
                    const saveStore = db.createObjectStore(STORES.SAVES, { keyPath: 'id', autoIncrement: true });
                    saveStore.createIndex('slotName', 'slotName', { unique: true });
                    saveStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create match history store
                if (!db.objectStoreNames.contains(STORES.MATCH_HISTORY)) {
                    const matchStore = db.createObjectStore(STORES.MATCH_HISTORY, { keyPath: 'id', autoIncrement: true });
                    matchStore.createIndex('season', 'season', { unique: false });
                    matchStore.createIndex('matchday', 'matchday', { unique: false });
                    matchStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create statistics store
                if (!db.objectStoreNames.contains(STORES.STATISTICS)) {
                    const statsStore = db.createObjectStore(STORES.STATISTICS, { keyPath: 'id', autoIncrement: true });
                    statsStore.createIndex('type', 'type', { unique: false });
                    statsStore.createIndex('season', 'season', { unique: false });
                }

                // Create backups store
                if (!db.objectStoreNames.contains(STORES.BACKUPS)) {
                    const backupStore = db.createObjectStore(STORES.BACKUPS, { keyPath: 'id', autoIncrement: true });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('IndexedDB schema created');
            };
        });
    }

    /**
     * Save game state to IndexedDB
     * @param {string} slotName - Save slot name
     * @param {Object} gameData - Game state data
     * @returns {Promise<boolean>} Success status
     */
    async saveGame(slotName, gameData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.SAVES], 'readwrite');
            const store = transaction.objectStore(STORES.SAVES);

            const saveData = {
                slotName,
                gameData,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            // First, try to find existing save with same slot name
            const index = store.index('slotName');
            const request = index.get(slotName);

            request.onsuccess = () => {
                if (request.result) {
                    // Update existing save
                    saveData.id = request.result.id;
                    const updateRequest = store.put(saveData);

                    updateRequest.onsuccess = () => {
                        console.log(`Save updated in IndexedDB: ${slotName}`);
                        resolve(true);
                    };

                    updateRequest.onerror = () => {
                        console.error('Failed to update save:', updateRequest.error);
                        reject(updateRequest.error);
                    };
                } else {
                    // Add new save
                    const addRequest = store.add(saveData);

                    addRequest.onsuccess = () => {
                        console.log(`Save created in IndexedDB: ${slotName}`);
                        resolve(true);
                    };

                    addRequest.onerror = () => {
                        console.error('Failed to create save:', addRequest.error);
                        reject(addRequest.error);
                    };
                }
            };

            request.onerror = () => {
                console.error('Failed to check existing save:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Load game state from IndexedDB
     * @param {string} slotName - Save slot name
     * @returns {Promise<Object|null>} Game data or null
     */
    async loadGame(slotName) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.SAVES], 'readonly');
            const store = transaction.objectStore(STORES.SAVES);
            const index = store.index('slotName');
            const request = index.get(slotName);

            request.onsuccess = () => {
                if (request.result) {
                    console.log(`Save loaded from IndexedDB: ${slotName}`);
                    resolve(request.result.gameData);
                } else {
                    console.warn(`No save found with slot name: ${slotName}`);
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('Failed to load save:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all saves from IndexedDB
     * @returns {Promise<Array>} Array of save data
     */
    async getAllSaves() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.SAVES], 'readonly');
            const store = transaction.objectStore(STORES.SAVES);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Failed to get all saves:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete a save from IndexedDB
     * @param {string} slotName - Save slot name
     * @returns {Promise<boolean>} Success status
     */
    async deleteSave(slotName) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.SAVES], 'readwrite');
            const store = transaction.objectStore(STORES.SAVES);
            const index = store.index('slotName');
            const request = index.get(slotName);

            request.onsuccess = () => {
                if (request.result) {
                    const deleteRequest = store.delete(request.result.id);

                    deleteRequest.onsuccess = () => {
                        console.log(`Save deleted from IndexedDB: ${slotName}`);
                        resolve(true);
                    };

                    deleteRequest.onerror = () => {
                        console.error('Failed to delete save:', deleteRequest.error);
                        reject(deleteRequest.error);
                    };
                } else {
                    console.warn(`No save found to delete: ${slotName}`);
                    resolve(false);
                }
            };

            request.onerror = () => {
                console.error('Failed to find save for deletion:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Save match history entry
     * @param {Object} matchData - Match data
     * @returns {Promise<boolean>} Success status
     */
    async saveMatchHistory(matchData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.MATCH_HISTORY], 'readwrite');
            const store = transaction.objectStore(STORES.MATCH_HISTORY);

            const entry = {
                ...matchData,
                timestamp: new Date().toISOString()
            };

            const request = store.add(entry);

            request.onsuccess = () => {
                console.log('Match history saved');
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to save match history:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get match history for a season
     * @param {number} season - Season number
     * @returns {Promise<Array>} Match history array
     */
    async getMatchHistory(season = null) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.MATCH_HISTORY], 'readonly');
            const store = transaction.objectStore(STORES.MATCH_HISTORY);

            let request;
            if (season !== null) {
                const index = store.index('season');
                request = index.getAll(season);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Failed to get match history:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Create automatic backup
     * @param {Object} gameData - Game state data
     * @returns {Promise<boolean>} Success status
     */
    async createBackup(gameData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.BACKUPS], 'readwrite');
            const store = transaction.objectStore(STORES.BACKUPS);

            const backup = {
                gameData,
                timestamp: new Date().toISOString(),
                type: 'auto'
            };

            const request = store.add(backup);

            request.onsuccess = () => {
                console.log('Backup created');
                this.pruneOldBackups(); // Clean up old backups
                resolve(true);
            };

            request.onerror = () => {
                console.error('Failed to create backup:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Prune old backups (keep only last 10)
     */
    async pruneOldBackups() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const transaction = this.db.transaction([STORES.BACKUPS], 'readwrite');
            const store = transaction.objectStore(STORES.BACKUPS);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');

            const backups = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    backups.push(cursor.value);
                    cursor.continue();
                } else {
                    // Keep only the 10 most recent backups
                    if (backups.length > 10) {
                        const toDelete = backups.slice(10);
                        toDelete.forEach(backup => {
                            store.delete(backup.id);
                        });
                        console.log(`Pruned ${toDelete.length} old backups`);
                    }
                }
            };
        } catch (error) {
            console.error('Failed to prune backups:', error);
        }
    }

    /**
     * Clear all data from IndexedDB
     * @returns {Promise<boolean>} Success status
     */
    async clearAll() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const storeNames = [STORES.SAVES, STORES.MATCH_HISTORY, STORES.STATISTICS, STORES.BACKUPS];

            for (const storeName of storeNames) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            console.log('All IndexedDB data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear IndexedDB:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Promise<Object>} Storage statistics
     */
    async getStorageStats() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const saves = await this.getAllSaves();
            const matchHistory = await this.getMatchHistory();

            return {
                totalSaves: saves.length,
                totalMatches: matchHistory.length,
                estimatedSize: this._estimateSize(saves) + this._estimateSize(matchHistory),
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return null;
        }
    }

    /**
     * Estimate size of data in bytes
     * @param {Array} data - Data array
     * @returns {number} Estimated size in bytes
     */
    _estimateSize(data) {
        try {
            const json = JSON.stringify(data);
            return new Blob([json]).size;
        } catch (error) {
            return 0;
        }
    }
}

// Singleton instance
export const indexedDBManager = new IndexedDBManager();

// Export store names for external use
export { STORES };
