import { describe, it, expect, beforeEach, vi } from 'vitest';

// squad-manager's buy/sell flows gate on a Yes/No confirm popup that only
// resolves via a real button click in the browser. Stub the popup module so
// the confirm callback fires immediately, letting these tests exercise the
// actual financial/strength math rather than just the popup wiring.
vi.mock('../ui/notification-system.js', () => ({
    showNotification: vi.fn(),
    showErrorPopup: vi.fn(),
    showSuccessPopup: vi.fn(),
    showConfirmPopup: vi.fn((title, message, onConfirm) => onConfirm())
}));
vi.mock('../ui/ui-controller.js', () => ({ updateUI: vi.fn() }));

const { gameState } = await import('../core/state-manager.js');
const { GAME_CONSTANTS } = await import('../data/constants.js');
const {
    initializeSquad,
    getUnavailableRatingPenalty,
    tickInjuriesAndSuspensions,
    buyPlayer,
    sellPlayer,
    generateTransferListings
} = await import('./squad-manager.js');

describe('initializeSquad', () => {
    beforeEach(() => {
        gameState.clubData.strength = 100;
        initializeSquad();
    });

    it('creates exactly one player per squad position', () => {
        expect(gameState.squad.length).toBe(GAME_CONSTANTS.SQUAD_POSITIONS.length);
        expect(gameState.squad.map(p => p.position)).toEqual(GAME_CONSTANTS.SQUAD_POSITIONS);
    });

    it('rates the Star player highest', () => {
        const star = gameState.squad.find(p => p.position === 'Star');
        const others = gameState.squad.filter(p => p.position !== 'Star');
        others.forEach(p => expect(star.rating).toBeGreaterThanOrEqual(p.rating));
    });

    it('never rates a player below the configured minimum', () => {
        gameState.clubData.strength = 1; // deliberately tiny, to hit the floor
        initializeSquad();
        gameState.squad.forEach(p => {
            expect(p.rating).toBeGreaterThanOrEqual(GAME_CONSTANTS.PLAYER_RATING_MIN);
        });
    });

    it('starts every player fully available (no injuries/suspensions)', () => {
        gameState.squad.forEach(p => {
            expect(p.injuredMatchesRemaining).toBe(0);
            expect(p.suspendedMatchesRemaining).toBe(0);
        });
    });
});

describe('getUnavailableRatingPenalty', () => {
    beforeEach(() => {
        gameState.clubData.strength = 100;
        initializeSquad();
    });

    it('is zero when the whole squad is available', () => {
        expect(getUnavailableRatingPenalty()).toBe(0);
    });

    it('sums the ratings of injured and suspended players only', () => {
        const [injured, suspended, ...rest] = gameState.squad;
        injured.injuredMatchesRemaining = 2;
        suspended.suspendedMatchesRemaining = 1;

        expect(getUnavailableRatingPenalty()).toBe(injured.rating + suspended.rating);

        const availableTotal = rest.reduce((sum, p) => sum + p.rating, 0);
        expect(getUnavailableRatingPenalty()).not.toBe(availableTotal);
    });
});

describe('tickInjuriesAndSuspensions', () => {
    beforeEach(() => {
        gameState.clubData.strength = 100;
        initializeSquad();
    });

    it('counts injury/suspension timers down by exactly one matchday', () => {
        gameState.squad[0].injuredMatchesRemaining = 3;
        gameState.squad[1].suspendedMatchesRemaining = 1;

        tickInjuriesAndSuspensions();

        expect(gameState.squad[0].injuredMatchesRemaining).toBe(2);
        expect(gameState.squad[1].suspendedMatchesRemaining).toBe(0);
    });

    it('never counts a timer below zero', () => {
        tickInjuriesAndSuspensions();
        gameState.squad.forEach(p => {
            expect(p.injuredMatchesRemaining).toBeGreaterThanOrEqual(0);
            expect(p.suspendedMatchesRemaining).toBeGreaterThanOrEqual(0);
        });
    });
});

describe('buyPlayer', () => {
    beforeEach(() => {
        gameState.clubData.strength = 100;
        gameState.clubData.transferBudget = 500000;
        initializeSquad();
        generateTransferListings();
    });

    it('deducts the exact listing price and adjusts strength by the exact rating delta', () => {
        const listing = gameState.transferListings[0];
        const replaced = gameState.squad.find(p => p.position === listing.position) ||
            gameState.squad.reduce((min, p) => (p.rating < min.rating ? p : min), gameState.squad[0]);

        const budgetBefore = gameState.clubData.transferBudget;
        const strengthBefore = gameState.clubData.strength;

        buyPlayer(listing.id);

        expect(gameState.clubData.transferBudget).toBe(budgetBefore - listing.price);
        expect(gameState.clubData.strength).toBe(strengthBefore - replaced.rating + listing.rating);
        expect(gameState.squad.some(p => p.id === listing.id)).toBe(true);
        expect(gameState.transferListings.some(l => l.id === listing.id)).toBe(false);
    });

    it('refuses the signing when the transfer budget is insufficient', () => {
        gameState.clubData.transferBudget = 0;
        const listing = gameState.transferListings[0];
        const squadBefore = gameState.squad.map(p => p.id);

        buyPlayer(listing.id);

        expect(gameState.clubData.transferBudget).toBe(0);
        expect(gameState.squad.map(p => p.id)).toEqual(squadBefore);
    });
});

describe('sellPlayer', () => {
    beforeEach(() => {
        gameState.clubData.strength = 100;
        gameState.clubData.transferBudget = 50000;
        initializeSquad();
    });

    it('pays the exact rating-based sale value and replaces the sold player with a minimum-rated free signing', () => {
        const player = gameState.squad[2];
        const expectedSaleValue = Math.round(
            player.rating * GAME_CONSTANTS.PLAYER_VALUE_PER_RATING * GAME_CONSTANTS.PLAYER_SELL_VALUE_MULTIPLIER
        );
        const budgetBefore = gameState.clubData.transferBudget;
        const strengthBefore = gameState.clubData.strength;

        sellPlayer(player.id);

        expect(gameState.clubData.transferBudget).toBe(budgetBefore + expectedSaleValue);
        expect(gameState.clubData.strength).toBe(strengthBefore - player.rating + GAME_CONSTANTS.PLAYER_RATING_MIN);
        expect(gameState.squad.length).toBe(5);
        expect(gameState.squad.some(p => p.id === player.id)).toBe(false);
    });
});

describe('generateTransferListings', () => {
    beforeEach(() => {
        generateTransferListings();
    });

    it('generates the configured number of listings, each priced off rating', () => {
        expect(gameState.transferListings.length).toBe(GAME_CONSTANTS.TRANSFER_MARKET_LISTING_COUNT);
        gameState.transferListings.forEach(listing => {
            expect(listing.price).toBe(listing.rating * GAME_CONSTANTS.PLAYER_VALUE_PER_RATING);
            expect(listing.rating).toBeGreaterThanOrEqual(GAME_CONSTANTS.PLAYER_RATING_MIN);
            expect(listing.rating).toBeLessThanOrEqual(GAME_CONSTANTS.PLAYER_RATING_MAX);
        });
    });
});
