import { describe, it, expect } from 'vitest';
import { rollWeightedDice } from './dice.js';
import { GAME_CONSTANTS } from '../data/constants.js';

describe('rollWeightedDice', () => {
    it('always returns an integer in [0, 5]', () => {
        for (let i = 0; i < 2000; i++) {
            const value = rollWeightedDice();
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(5);
        }
    });

    it('matches the configured DICE_WEIGHTS distribution within tolerance', () => {
        const samples = 50000;
        const counts = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < samples; i++) {
            counts[rollWeightedDice()]++;
        }

        GAME_CONSTANTS.DICE_WEIGHTS.forEach((expectedWeight, face) => {
            const actualWeight = counts[face] / samples;
            // Loose tolerance -- this is a statistical test, not exact
            expect(actualWeight).toBeGreaterThan(expectedWeight - 0.02);
            expect(actualWeight).toBeLessThan(expectedWeight + 0.02);
        });
    });
});
