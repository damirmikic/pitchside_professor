/**
 * EventManager - Manages event listeners with proper cleanup
 * Prevents memory leaks by tracking all event listeners
 */
export class EventManager {
    constructor() {
        this.listeners = [];
    }

    /**
     * Add an event listener and track it for cleanup
     * @param {Element} element - DOM element to attach listener to
     * @param {string} event - Event type (e.g., 'click', 'input')
     * @param {Function} handler - Event handler function
     * @param {Object} options - Optional event listener options
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) {
            console.warn('EventManager: Attempted to add listener to null element');
            return;
        }

        element.addEventListener(event, handler, options);
        this.listeners.push({ element, event, handler, options });
    }

    /**
     * Remove a specific event listener
     * @param {Element} element - DOM element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     */
    removeEventListener(element, event, handler) {
        if (!element) return;

        element.removeEventListener(event, handler);
        this.listeners = this.listeners.filter(
            listener => !(listener.element === element && listener.event === event && listener.handler === handler)
        );
    }

    /**
     * Remove all tracked event listeners
     * Call this when cleaning up or navigating away
     */
    cleanup() {
        this.listeners.forEach(({ element, event, handler }) => {
            try {
                element.removeEventListener(event, handler);
            } catch (error) {
                console.warn('EventManager: Error removing listener', error);
            }
        });
        this.listeners = [];
    }

    /**
     * Get count of tracked listeners
     * @returns {number} Number of active listeners
     */
    getListenerCount() {
        return this.listeners.length;
    }
}

// Export singleton instance
export const eventManager = new EventManager();
