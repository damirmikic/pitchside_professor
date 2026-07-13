import { describe, it, expect, beforeEach } from 'vitest';
import { gameState } from '../core/state-manager.js';
import { leagues } from '../data/leagues.js';
import { generateFixtures, initializeLeagueTable } from './match-manager.js';

const LEAGUE = 'Celestial Super League';
const TEAM = 'Quantum Rovers';

describe('generateFixtures', () => {
    beforeEach(() => {
        gameState.selectedLeague = LEAGUE;
        gameState.selectedTeam = TEAM;
        gameState.clubData.strength = 100;
        generateFixtures();
    });

    const teamNames = leagues[LEAGUE].map(t => t.name);
    const matchdayCount = (teamNames.length - 1) * 2;

    it('produces one matchday per round of a full home-and-away double round-robin', () => {
        expect(gameState.fixtures.length).toBe(matchdayCount);
    });

    it('never schedules a team against itself', () => {
        gameState.fixtures.forEach(matchday => {
            matchday.forEach(fixture => {
                expect(fixture.home).not.toBe(fixture.away);
            });
        });
    });

    it('has every team play exactly once per matchday', () => {
        gameState.fixtures.forEach(matchday => {
            const playing = matchday.flatMap(f => [f.home, f.away]);
            expect(playing.sort()).toEqual([...teamNames].sort());
        });
    });

    it('mirrors every pairing: each team plays every other team exactly twice, once at home and once away', () => {
        const pairCounts = new Map(); // key: "A|B" (A home) -> count

        gameState.fixtures.forEach(matchday => {
            matchday.forEach(({ home, away }) => {
                const key = `${home}|${away}`;
                pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
            });
        });

        for (let i = 0; i < teamNames.length; i++) {
            for (let j = i + 1; j < teamNames.length; j++) {
                const a = teamNames[i];
                const b = teamNames[j];
                expect(pairCounts.get(`${a}|${b}`)).toBe(1);
                expect(pairCounts.get(`${b}|${a}`)).toBe(1);
            }
        }
    });

    it('starts every fixture unplayed with no goals recorded', () => {
        gameState.fixtures.forEach(matchday => {
            matchday.forEach(fixture => {
                expect(fixture.played).toBe(false);
                expect(fixture.homeGoals).toBeNull();
                expect(fixture.awayGoals).toBeNull();
            });
        });
    });
});

describe('initializeLeagueTable', () => {
    beforeEach(() => {
        gameState.selectedLeague = LEAGUE;
        gameState.selectedTeam = TEAM;
        gameState.clubData.strength = 123;
        initializeLeagueTable();
    });

    it('creates one table row per team in the league', () => {
        expect(gameState.leagueTable.length).toBe(leagues[LEAGUE].length);
    });

    it('starts every team at zero played/points with no goals', () => {
        gameState.leagueTable.forEach(row => {
            expect(row.played).toBe(0);
            expect(row.points).toBe(0);
            expect(row.goalsFor).toBe(0);
            expect(row.goalsAgainst).toBe(0);
        });
    });

    it("uses the player's club strength for the player's row, not the league data's baseStrength", () => {
        const playerRow = gameState.leagueTable.find(row => row.name === TEAM);
        expect(playerRow.strength).toBe(123);
        expect(playerRow.isPlayer).toBe(true);
    });

    it("uses each opponent's baseStrength * 10 for non-player rows", () => {
        const opponent = leagues[LEAGUE].find(t => t.name !== TEAM);
        const opponentRow = gameState.leagueTable.find(row => row.name === opponent.name);
        expect(opponentRow.strength).toBe(opponent.baseStrength * 10);
        expect(opponentRow.isPlayer).toBe(false);
    });
});
