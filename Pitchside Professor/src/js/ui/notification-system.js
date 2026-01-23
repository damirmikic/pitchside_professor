/**
 * Notification System
 * Handles all popup dialogs and notifications
 */

/**
 * Close a popup with animation
 * @param {HTMLElement} popup - The popup element to close
 */
export function closePopup(popup) {
    popup.style.animation = 'fadeIn 0.2s ease-out reverse';
    setTimeout(() => {
        if (popup.parentNode) {
            document.body.removeChild(popup);
        }
    }, 200);
}

/**
 * Show an animated popup with customizable buttons
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @param {string} type - Popup type (info, success, warning, error)
 * @param {Array} buttons - Array of button objects {text, action}
 * @returns {HTMLElement} The popup element
 */
export function showAnimatedPopup(title, message, type = 'info', buttons = null) {
    const popup = document.createElement('div');
    popup.className = 'animated-popup';

    let typeClass = '';
    if (type === 'success') typeClass = 'popup-success';
    else if (type === 'warning') typeClass = 'popup-warning';
    else if (type === 'error') typeClass = 'popup-error';

    const defaultButtons = buttons || [{ text: 'OK', action: () => closePopup(popup) }];

    const buttonHTML = defaultButtons.map(btn =>
        `<button onclick="${btn.action.toString().replace('function', 'function temp')}; temp.call(this);">${btn.text}</button>`
    ).join('');

    popup.innerHTML = `
        <div class="popup-content ${typeClass}">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="popup-buttons">
                ${buttonHTML}
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    // Store button actions on the popup element for access
    defaultButtons.forEach((btn, index) => {
        const buttonElement = popup.querySelectorAll('.popup-buttons button')[index];
        buttonElement.onclick = () => {
            btn.action();
            closePopup(popup);
        };
    });

    return popup;
}

/**
 * Show a success popup
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @returns {HTMLElement} The popup element
 */
export function showSuccessPopup(title, message) {
    return showAnimatedPopup(title, message, 'success');
}

/**
 * Show a warning popup
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @returns {HTMLElement} The popup element
 */
export function showWarningPopup(title, message) {
    return showAnimatedPopup(title, message, 'warning');
}

/**
 * Show an error popup
 * @param {string} title - Popup title
 * @param {string} message - Popup message
 * @returns {HTMLElement} The popup element
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
 * @returns {HTMLElement} The popup element
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
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

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
