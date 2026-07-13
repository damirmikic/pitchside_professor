import { describe, it, expect, beforeEach } from 'vitest';
import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { calculateSeasonTicketSales, calculateMatchdayRevenue } from './finance-manager.js';

describe('calculateSeasonTicketSales', () => {
    beforeEach(() => {
        gameState.clubData.stadiumCapacity = 2000;
        gameState.clubData.finances = 0;
        gameState.fanData.seasonTicketPrice = 100;
        gameState.fanData.happiness = 60;
    });

    it('adds season ticket revenue to club finances', () => {
        calculateSeasonTicketSales();

        const { fanData, clubData } = gameState;
        const expectedSold = Math.floor(fanData.maxSeasonTickets *
            Math.max(0.2, 1 - (fanData.seasonTicketPrice - 50) / 200) *
            (fanData.happiness / 100));

        expect(fanData.seasonTicketsSold).toBe(expectedSold);
        expect(clubData.seasonTicketRevenue).toBe(expectedSold * fanData.seasonTicketPrice);
        expect(clubData.finances).toBe(clubData.seasonTicketRevenue);
    });

    it('sells more tickets at higher fan happiness, all else equal', () => {
        gameState.fanData.happiness = 20;
        calculateSeasonTicketSales();
        const lowHappinessSold = gameState.fanData.seasonTicketsSold;

        gameState.fanData.happiness = 100;
        calculateSeasonTicketSales();
        const highHappinessSold = gameState.fanData.seasonTicketsSold;

        expect(highHappinessSold).toBeGreaterThan(lowHappinessSold);
    });

    it('sells fewer tickets at a higher price, all else equal', () => {
        gameState.fanData.seasonTicketPrice = 50;
        calculateSeasonTicketSales();
        const cheapSold = gameState.fanData.seasonTicketsSold;

        gameState.fanData.seasonTicketPrice = 250;
        calculateSeasonTicketSales();
        const expensiveSold = gameState.fanData.seasonTicketsSold;

        expect(expensiveSold).toBeLessThan(cheapSold);
    });
});

describe('calculateMatchdayRevenue', () => {
    beforeEach(() => {
        gameState.clubData.stadiumCapacity = 1000;
        gameState.clubData.finances = 0;
        gameState.clubData.concessionsLevel = 1;
        gameState.clubData.storeLevel = 1;
        gameState.fanData.happiness = 50;
        gameState.fanData.matchdayTicketPrice = 20;
    });

    it('computes attendance from capacity and happiness, and adds ticket/concession/merch revenue to finances', () => {
        const result = calculateMatchdayRevenue();
        const { clubData, fanData } = gameState;

        const expectedAttendance = Math.floor(clubData.stadiumCapacity * (0.6 + (fanData.happiness / 100) * 0.4));
        expect(result.attendance).toBe(expectedAttendance);

        const concessionPerFan = GAME_CONSTANTS.CONCESSION_REVENUE_PER_FAN_BASE;
        const merchPerFan = GAME_CONSTANTS.MERCHANDISE_REVENUE_PER_FAN_BASE;
        const expectedRevenue = expectedAttendance * fanData.matchdayTicketPrice +
            expectedAttendance * concessionPerFan +
            expectedAttendance * merchPerFan;

        expect(result.revenue).toBe(expectedRevenue);
        expect(clubData.finances).toBe(expectedRevenue);
        expect(clubData.matchdayRevenue).toBe(expectedRevenue);
    });

    it('higher concessions/store levels increase revenue for the same attendance', () => {
        const baseline = calculateMatchdayRevenue();

        gameState.clubData.finances = 0;
        gameState.clubData.concessionsLevel = 3;
        gameState.clubData.storeLevel = 3;
        const upgraded = calculateMatchdayRevenue();

        expect(upgraded.attendance).toBe(baseline.attendance);
        expect(upgraded.revenue).toBeGreaterThan(baseline.revenue);
    });
});
