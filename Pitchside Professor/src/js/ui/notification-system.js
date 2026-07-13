/**
 * Notification System
 * Handles all popup dialogs and notifications
 */

// Only one animated popup is ever on screen at a time; anything else shown
// while one is active queues up and displays the moment it closes, so
// players never lose a click to a popup stacked underneath another.
let activePopup = null;
const popupQueue = [];

/**
 * Close a popup (or the currently active one, if called with no argument)
 * and advance to the next queued popup, if any.
 * @param {HTMLElement} [popup] - The popup element to close
 */
export function closePopup(popup) {
    const target = popup || activePopup;
    if (!target || !target.parentNode) {
        if (target === activePopup) {
            activePopup = null;
            advanceQueue();
        }
        return;
    }

    target.style.animation = 'fadeIn 0.2s ease-out reverse';
    setTimeout(() => {
        if (target.parentNode) {
            document.body.removeChild(target);
        }
        if (target === activePopup) {
            activePopup = null;
            advanceQueue();
        }
    }, 200);
}

/**
 * Immediately dismiss the active popup and clear anything queued behind it.
 * Used when a more important flow needs to clear the slate rather than
 * stack on top of, or wait behind, whatever's currently showing.
 */
export function closeAllPopups() {
    popupQueue.length = 0;
    const current = activePopup;
    activePopup = null;
    if (current && current.parentNode) {
        document.body.removeChild(current);
    }
}

function advanceQueue() {
    if (activePopup || popupQueue.length === 0) return;
    renderPopup(popupQueue.shift());
}

/**
 * Show an animated popup with customizable buttons. If a popup is already
 * on screen, this one queues and renders once the current one closes.
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @param {string} type - Popup type (info, success, warning, error)
 * @param {Array} buttons - Array of button objects {text, action}
 * @returns {HTMLElement|null} The popup element if shown immediately, or null while queued
 */
export function showAnimatedPopup(title, message, type = 'info', buttons = null) {
    const spec = { title, message, type, buttons: buttons || [{ text: 'OK', action: () => {} }] };

    if (activePopup) {
        popupQueue.push(spec);
        return null;
    }

    return renderPopup(spec);
}

/**
 * Render a queued popup spec to the DOM and wire up its close behavior:
 * any button click, Escape, or a click on the backdrop all resolve the
 * popup exactly once and hand off to the next queued one.
 * @param {Object} spec
 */
function renderPopup({ title, message, type, buttons }) {
    const popup = document.createElement('div');
    popup.className = 'animated-popup';

    let typeClass = '';
    if (type === 'success') typeClass = 'popup-success';
    else if (type === 'warning') typeClass = 'popup-warning';
    else if (type === 'error') typeClass = 'popup-error';

    popup.innerHTML = `
        <div class="popup-content ${typeClass}">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="popup-buttons">
                ${buttons.map((btn, i) => `<button type="button" data-btn-index="${i}">${btn.text}</button>`).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(popup);
    activePopup = popup;

    // The last button is the safe default for Escape/backdrop dismissal:
    // Cancel/No for confirm popups, the sole OK for single-button ones.
    const dismissAction = buttons[buttons.length - 1].action;

    function finish(action) {
        document.removeEventListener('keydown', onKeydown);
        action();
        closePopup(popup);
    }

    function onKeydown(e) {
        if (e.key === 'Escape') finish(dismissAction);
    }
    document.addEventListener('keydown', onKeydown);

    buttons.forEach((btn, index) => {
        const buttonElement = popup.querySelector(`[data-btn-index="${index}"]`);
        buttonElement.addEventListener('click', () => finish(btn.action));
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) finish(dismissAction);
    });

    return popup;
}

/**
 * Show a success popup
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @returns {HTMLElement|null} The popup element
 */
export function showSuccessPopup(title, message) {
    return showAnimatedPopup(title, message, 'success');
}

/**
 * Show a warning popup
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @returns {HTMLElement|null} The popup element
 */
export function showWarningPopup(title, message) {
    return showAnimatedPopup(title, message, 'warning');
}

/**
 * Show an error popup
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @returns {HTMLElement|null} The popup element
 */
export function showErrorPopup(title, message) {
    return showAnimatedPopup(title, message, 'error');
}

/**
 * Show a confirmation popup with Yes/No buttons
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @param {Function} onConfirm - Function to call on confirmation
 * @param {Function} onCancel - Function to call on cancellation
 * @returns {HTMLElement|null} The popup element
 */
export function showConfirmPopup(title, message, onConfirm, onCancel = null) {
    const buttons = [
        { text: 'Yes', action: onConfirm },
        { text: 'No', action: onCancel || (() => { }) }
    ];
    return showAnimatedPopup(title, message, 'warning', buttons);
}

/**
 * Show a temporary notification toast
 * Supports two call styles used throughout the codebase:
 *   showNotification(message, type)
 *   showNotification(title, message, type)
 * @param {string} titleOrMessage - Notification title (3-arg form) or message (2-arg form)
 * @param {string} [messageOrType] - Notification message (3-arg form) or type (2-arg form)
 * @param {string} [maybeType] - Notification type when called with a title (success, error, warning, info)
 */
export function showNotification(titleOrMessage, messageOrType, maybeType) {
    let title = null;
    let message;
    let type;

    if (maybeType !== undefined) {
        title = titleOrMessage;
        message = messageOrType;
        type = maybeType;
    } else {
        message = titleOrMessage;
        type = messageOrType || 'info';
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    if (title) {
        const titleEl = document.createElement('strong');
        titleEl.textContent = title;
        notification.appendChild(titleEl);
        notification.appendChild(document.createTextNode(`: ${message}`));
    } else {
        notification.textContent = message;
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
