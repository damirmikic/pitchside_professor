/**
 * DOMBatcher - Batches DOM updates using requestAnimationFrame
 * Prevents excessive reflows and repaints by scheduling updates efficiently
 */
export class DOMBatcher {
    constructor() {
        this.updateQueue = new Set();
        this.rafId = null;
        this.isScheduled = false;
    }

    /**
     * Schedule a DOM update function
     * @param {Function} updateFn - Function to execute for DOM update
     */
    scheduleUpdate(updateFn) {
        this.updateQueue.add(updateFn);

        if (!this.isScheduled) {
            this.isScheduled = true;
            this.rafId = requestAnimationFrame(() => this.flush());
        }
    }

    /**
     * Execute all queued updates
     * @private
     */
    flush() {
        const updates = Array.from(this.updateQueue);
        this.updateQueue.clear();
        this.isScheduled = false;

        // Execute all updates in a single animation frame
        updates.forEach(updateFn => {
            try {
                updateFn();
            } catch (error) {
                console.error('DOMBatcher: Error executing update', error);
            }
        });
    }

    /**
     * Cancel all pending updates
     */
    cancel() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.updateQueue.clear();
        this.isScheduled = false;
    }

    /**
     * Get count of pending updates
     * @returns {number} Number of pending updates
     */
    getPendingCount() {
        return this.updateQueue.size;
    }
}

/**
 * BatchedDOMUpdater - Helper for common DOM update patterns
 */
export class BatchedDOMUpdater {
    constructor() {
        this.batcher = new DOMBatcher();
        this.elementCache = new Map();
    }

    /**
     * Cache a DOM element reference
     * @param {string} id - Element ID
     * @returns {Element|null} Cached element
     */
    cacheElement(id) {
        if (!this.elementCache.has(id)) {
            this.elementCache.set(id, document.getElementById(id));
        }
        return this.elementCache.get(id);
    }

    /**
     * Update text content of an element (batched)
     * @param {string} elementId - Element ID
     * @param {string} text - New text content
     */
    updateText(elementId, text) {
        this.batcher.scheduleUpdate(() => {
            const element = this.cacheElement(elementId);
            if (element) {
                element.textContent = text;
            }
        });
    }

    /**
     * Update multiple text elements at once (batched)
     * @param {Object} updates - Object mapping element IDs to text content
     */
    updateMultipleTexts(updates) {
        this.batcher.scheduleUpdate(() => {
            Object.entries(updates).forEach(([elementId, text]) => {
                const element = this.cacheElement(elementId);
                if (element) {
                    element.textContent = text;
                }
            });
        });
    }

    /**
     * Update element styles (batched)
     * @param {string} elementId - Element ID
     * @param {Object} styles - Object mapping style properties to values
     */
    updateStyles(elementId, styles) {
        this.batcher.scheduleUpdate(() => {
            const element = this.cacheElement(elementId);
            if (element) {
                Object.assign(element.style, styles);
            }
        });
    }

    /**
     * Update element attributes (batched)
     * @param {string} elementId - Element ID
     * @param {Object} attributes - Object mapping attribute names to values
     */
    updateAttributes(elementId, attributes) {
        this.batcher.scheduleUpdate(() => {
            const element = this.cacheElement(elementId);
            if (element) {
                Object.entries(attributes).forEach(([attr, value]) => {
                    element.setAttribute(attr, value);
                });
            }
        });
    }

    /**
     * Clear element cache (call when DOM structure changes significantly)
     */
    clearCache() {
        this.elementCache.clear();
    }

    /**
     * Cancel all pending updates
     */
    cancel() {
        this.batcher.cancel();
    }
}

// Export singleton instance
export const domUpdater = new BatchedDOMUpdater();
