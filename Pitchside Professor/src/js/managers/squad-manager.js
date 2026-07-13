/**
 * Squad Manager Module
 * Handles the lightweight 5-player key squad: initialization, injuries and
 * suspensions, the transfer market, and the youth academy payoff.
 *
 * This is not full player management -- ratings are a simplified stand-in
 * for player quality, and the squad always stays at exactly 5 players
 * (one per GAME_CONSTANTS.SQUAD_POSITIONS slot).
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showNotification, showConfirmPopup, showErrorPopup, showSuccessPopup } from '../ui/notification-system.js';
import { updateUI } from '../ui/ui-controller.js';

const FIRST_NAMES = [
    'Marcus', 'Diego', 'Kwame', 'Luca', 'Hiroshi', 'Sven', 'Tariq', 'Owen',
    'Mateo', 'Kofi', 'Andrei', 'Felix', 'Rafael', 'Jin', 'Bruno', 'Callum'
];
const LAST_NAMES = [
    'Silva', 'Nowak', 'Okafor', 'Rossi', 'Tanaka', 'Andersson', 'Haddad', 'Byrne',
    'Fernandez', 'Mensah', 'Popescu', 'Keller', 'Costa', 'Park', 'Moreau', 'Walsh'
];

let nextPlayerId = 1;

/**
 * Random integer in [min, max], inclusive
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayerName() {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${first} ${last}`;
}

function makePlayer(position, rating) {
    return {
        id: nextPlayerId++,
        name: generatePlayerName(),
        position,
        rating,
        injuredMatchesRemaining: 0,
        suspendedMatchesRemaining: 0
    };
}

/**
 * Generate a fresh 5-player squad whose ratings sum to roughly
 * clubData.strength, with the Star player rated highest. Called once when a
 * new job starts (after clubData.strength is set for the new club).
 */
export function initializeSquad() {
    const { clubData } = gameState;
    const positions = GAME_CONSTANTS.SQUAD_POSITIONS;
    const weights = [0.9, 1.0, 1.0, 1.05, 1.15];
    const weightSum = weights.reduce((sum, w) => sum + w, 0);

    gameState.squad = positions.map((position, i) => {
        const rating = Math.max(
            GAME_CONSTANTS.PLAYER_RATING_MIN,
            Math.round((clubData.strength / weightSum) * weights[i])
        );
        return makePlayer(position, rating);
    });

    renderSquad();
}

/**
 * Combined rating of squad members currently unavailable (injured or
 * suspended), used to reduce effective match strength.
 * @returns {number}
 */
export function getUnavailableRatingPenalty() {
    return gameState.squad.reduce((sum, player) => {
        const unavailable = player.injuredMatchesRemaining > 0 || player.suspendedMatchesRemaining > 0;
        return sum + (unavailable ? player.rating : 0);
    }, 0);
}

/**
 * Count down injury/suspension timers by one matchday, announcing returns.
 */
export function tickInjuriesAndSuspensions() {
    const recovered = [];

    gameState.squad.forEach(player => {
        if (player.injuredMatchesRemaining > 0) {
            player.injuredMatchesRemaining--;
            if (player.injuredMatchesRemaining === 0) recovered.push(player.name);
        }
        if (player.suspendedMatchesRemaining > 0) {
            player.suspendedMatchesRemaining--;
            if (player.suspendedMatchesRemaining === 0) recovered.push(player.name);
        }
    });

    if (recovered.length > 0) {
        const verb = recovered.length > 1 ? 'are' : 'is';
        showNotification('Squad Update', `${recovered.join(', ')} ${verb} available again!`, 'success');
    }

    renderSquad();
}

/**
 * Small chance each matchday that an available squad member is ruled out
 * with an injury or suspension.
 */
export function maybeInjureOrSuspendPlayer() {
    if (Math.random() >= GAME_CONSTANTS.INJURY_OR_SUSPENSION_CHANCE_PER_MATCH) return;

    const available = gameState.squad.filter(
        player => player.injuredMatchesRemaining === 0 && player.suspendedMatchesRemaining === 0
    );
    if (available.length === 0) return;

    const player = available[Math.floor(Math.random() * available.length)];

    if (Math.random() < GAME_CONSTANTS.INJURY_CHANCE_SHARE) {
        const duration = randomInt(GAME_CONSTANTS.INJURY_DURATION_MATCHES_MIN, GAME_CONSTANTS.INJURY_DURATION_MATCHES_MAX);
        player.injuredMatchesRemaining = duration;
        showNotification('Injury News', `${player.name} has picked up an injury and will miss the next ${duration} match${duration > 1 ? 'es' : ''}.`, 'warning');
    } else {
        player.suspendedMatchesRemaining = GAME_CONSTANTS.SUSPENSION_DURATION_MATCHES;
        showNotification('Disciplinary News', `${player.name} has been suspended for the next match.`, 'warning');
    }

    renderSquad();
}

/**
 * Once per season, a chance (scaling with academy level) that the youth
 * academy produces a free prospect who replaces the weakest squad member.
 */
export function rollAcademyPayoff() {
    const { clubData, squad } = gameState;
    if (squad.length === 0) return;

    const chance = clubData.academyLevel * GAME_CONSTANTS.ACADEMY_PROSPECT_CHANCE_PER_LEVEL;
    if (Math.random() >= chance) return;

    const rating = randomInt(GAME_CONSTANTS.ACADEMY_PROSPECT_RATING_MIN, GAME_CONSTANTS.ACADEMY_PROSPECT_RATING_MAX);
    const weakestIndex = squad.reduce((minIdx, player, idx) => (player.rating < squad[minIdx].rating ? idx : minIdx), 0);
    const replaced = squad[weakestIndex];
    if (rating <= replaced.rating) return;

    clubData.strength += (rating - replaced.rating);
    const prospect = makePlayer(replaced.position, rating);
    squad[weakestIndex] = prospect;

    showSuccessPopup(
        'Academy Graduate!',
        `Your youth academy has produced a gem! ${prospect.name} (rating ${rating}) has forced their way into the first team, replacing ${replaced.name}.`
    );

    renderSquad();
    updateUI();
}

/**
 * Generate a fresh set of transfer-market listings (called on game start and
 * at the start of each new season).
 */
export function generateTransferListings() {
    const positions = GAME_CONSTANTS.SQUAD_POSITIONS;
    const listings = [];

    for (let i = 0; i < GAME_CONSTANTS.TRANSFER_MARKET_LISTING_COUNT; i++) {
        const position = positions[Math.floor(Math.random() * positions.length)];
        const rating = randomInt(GAME_CONSTANTS.PLAYER_RATING_MIN, GAME_CONSTANTS.PLAYER_RATING_MAX);
        const player = makePlayer(position, rating);
        listings.push({ ...player, price: rating * GAME_CONSTANTS.PLAYER_VALUE_PER_RATING });
    }

    gameState.transferListings = listings;
    renderTransferMarket();
}

/**
 * Find the squad slot a new signing should fill: same position if present,
 * otherwise the weakest-rated player overall.
 */
function findReplacementIndex(position) {
    const { squad } = gameState;
    const samePosition = squad.findIndex(player => player.position === position);
    if (samePosition !== -1) return samePosition;
    return squad.reduce((minIdx, player, idx) => (player.rating < squad[minIdx].rating ? idx : minIdx), 0);
}

/**
 * Sign a player from the transfer market, replacing the appropriate squad slot.
 * @param {number} listingId
 */
export function buyPlayer(listingId) {
    const { transferListings, clubData, squad } = gameState;
    const listing = transferListings.find(item => item.id === listingId);
    if (!listing) return;

    if (clubData.transferBudget < listing.price) {
        showErrorPopup('Insufficient Transfer Budget', `You need $${listing.price.toLocaleString()} to sign ${listing.name}.`);
        return;
    }

    showConfirmPopup(
        'Confirm Transfer',
        `Sign ${listing.name} (${listing.position}, rating ${listing.rating}) for $${listing.price.toLocaleString()}?`,
        () => {
            const replaceIndex = findReplacementIndex(listing.position);
            const replaced = squad[replaceIndex];

            clubData.transferBudget -= listing.price;
            clubData.strength = Math.max(0, clubData.strength - replaced.rating + listing.rating);

            squad[replaceIndex] = {
                id: listing.id,
                name: listing.name,
                position: listing.position,
                rating: listing.rating,
                injuredMatchesRemaining: 0,
                suspendedMatchesRemaining: 0
            };

            gameState.transferListings = transferListings.filter(item => item.id !== listingId);

            showSuccessPopup('Transfer Complete!', `${listing.name} has joined the club, replacing ${replaced.name}.`);
            renderSquad();
            renderTransferMarket();
            updateUI();
            gameState.autoSave();
        }
    );
}

/**
 * Sell a squad member; a free replacement-level player is signed to keep the
 * squad at 5.
 * @param {number} playerId
 */
export function sellPlayer(playerId) {
    const { squad, clubData } = gameState;
    const index = squad.findIndex(player => player.id === playerId);
    if (index === -1) return;

    const player = squad[index];
    const saleValue = Math.round(player.rating * GAME_CONSTANTS.PLAYER_VALUE_PER_RATING * GAME_CONSTANTS.PLAYER_SELL_VALUE_MULTIPLIER);

    showConfirmPopup(
        'Confirm Sale',
        `Sell ${player.name} (rating ${player.rating}) for $${saleValue.toLocaleString()}? A free replacement-level player will be signed in their place.`,
        () => {
            clubData.transferBudget += saleValue;

            const replacement = makePlayer(player.position, GAME_CONSTANTS.PLAYER_RATING_MIN);
            clubData.strength = Math.max(0, clubData.strength - player.rating + replacement.rating);
            squad[index] = replacement;

            showSuccessPopup('Player Sold', `${player.name} has been sold for $${saleValue.toLocaleString()}.`);
            renderSquad();
            updateUI();
            gameState.autoSave();
        }
    );
}

/**
 * Human-readable availability status for a squad member
 */
function playerStatus(player) {
    if (player.injuredMatchesRemaining > 0) return `Injured (${player.injuredMatchesRemaining} left)`;
    if (player.suspendedMatchesRemaining > 0) return `Suspended (${player.suspendedMatchesRemaining} left)`;
    return 'Available';
}

/**
 * Render the current squad into the Training (Squad Overview) view
 */
export function renderSquad() {
    const list = document.getElementById('squad-list');
    const strengthDisplay = document.getElementById('team-strength-display');
    if (strengthDisplay) strengthDisplay.textContent = gameState.clubData.strength;
    if (!list) return;

    list.innerHTML = gameState.squad.map(player => `
        <article class="job-offer-card">
            <div class="offer-header">
                <h3>${player.name}</h3>
                <span class="offer-type">${player.position}</span>
            </div>
            <div class="offer-details">
                <div class="offer-row"><span class="label">Rating:</span><span class="value">${player.rating}</span></div>
                <div class="offer-row"><span class="label">Status:</span><span class="value">${playerStatus(player)}</span></div>
            </div>
            <button class="accept-offer-btn btn btn-primary sell-player-btn" data-player-id="${player.id}">Sell Player</button>
        </article>
    `).join('');

    list.querySelectorAll('.sell-player-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const playerId = parseInt(e.target.dataset.playerId);
            sellPlayer(playerId);
        });
    });
}

/**
 * Render the transfer market listings into the Transfers view
 */
export function renderTransferMarket() {
    const budgetDisplay = document.getElementById('transfer-budget-display');
    if (budgetDisplay) budgetDisplay.textContent = gameState.clubData.transferBudget.toLocaleString();

    const list = document.getElementById('transfer-market-listings');
    if (!list) return;

    list.innerHTML = gameState.transferListings.map(listing => `
        <article class="job-offer-card">
            <div class="offer-header">
                <h3>${listing.name}</h3>
                <span class="offer-type">${listing.position}</span>
            </div>
            <div class="offer-details">
                <div class="offer-row"><span class="label">Rating:</span><span class="value">${listing.rating}</span></div>
                <div class="offer-row"><span class="label">Price:</span><span class="value">$${listing.price.toLocaleString()}</span></div>
            </div>
            <button class="accept-offer-btn btn btn-primary buy-player-btn" data-listing-id="${listing.id}">Sign Player</button>
        </article>
    `).join('');

    list.querySelectorAll('.buy-player-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const listingId = parseInt(e.target.dataset.listingId);
            buyPlayer(listingId);
        });
    });
}
