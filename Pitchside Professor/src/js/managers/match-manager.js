/**
 * Match Manager Module
 * Handles all match-related functionality including fixtures, simulations, and results
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showAnimatedPopup, showWarningPopup } from '../ui/notification-system.js';
import { calculateMatchdayRevenue, processWeeklyWages } from './finance-manager.js';
import { updateUI, updateSidebarDisplays } from '../ui/ui-controller.js';
import { rollWeightedDice } from '../utils/dice.js';

/**
 * Rare match events that can nudge a result, shown to the player for flavour
 */
const MATCH_EVENTS = [
    { id: 'wondergoal', label: 'A stunning strike finds the net!', target: 'own', goalDelta: 1 },
    { id: 'injury_time_winner', label: 'A dramatic goal in injury time!', target: 'own', goalDelta: 1 },
    { id: 'opponent_red_card', label: 'Red card! The opposition is down to ten men.', target: 'opponent', goalDelta: -1 },
    { id: 'penalty_saved', label: 'Penalty saved! Your keeper is the hero.', target: 'opponent', goalDelta: -1 },
    { id: 'opponent_wondergoal', label: 'The opposition score a screamer of their own!', target: 'opponent', goalDelta: 1 },
    { id: 'own_red_card', label: 'Your player sees red! Down to ten men.', target: 'own', goalDelta: -1 },
    { id: 'penalty_missed', label: 'Penalty missed! A golden chance goes begging.', target: 'own', goalDelta: -1 }
];

/**
 * Roll for a random match event
 * @returns {Object} A random entry from MATCH_EVENTS
 */
function rollMatchEvent() {
    return MATCH_EVENTS[Math.floor(Math.random() * MATCH_EVENTS.length)];
}

/**
 * Clamp a dice/goal value to the valid 0-5 range
 * @param {number} value
 * @returns {number}
 */
function clampDice(value) {
    return Math.max(0, Math.min(5, value));
}

/**
 * Initialize the league table with all teams
 * Strength is stored on the same 0-100 scale as clubData.strength (baseStrength × 10)
 * so that club upgrades have a real effect on match simulation.
 */
export function initializeLeagueTable() {
    const { selectedLeague, selectedTeam, leagues, clubData } = gameState;

    gameState.leagueTable = leagues[selectedLeague].map(team => ({
        name: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        strength: team.name === selectedTeam ? clubData.strength : team.baseStrength * 10,
        isPlayer: team.name === selectedTeam
    }));

    updateLeagueTable();
}

/**
 * Sync the player's league-table strength entry with clubData.strength
 * so training/upgrades affect match outcomes. Squad fitness is applied as a
 * multiplier on top, so a tired squad is measurably weaker than a fresh one.
 */
export function syncPlayerStrength() {
    const { leagueTable, selectedTeam, clubData } = gameState;
    const playerTeam = leagueTable.find(team => team.name === selectedTeam);
    if (playerTeam) {
        const fitnessMultiplier = GAME_CONSTANTS.FITNESS_STRENGTH_MULTIPLIER_BASE +
            GAME_CONSTANTS.FITNESS_STRENGTH_MULTIPLIER_RANGE * (clubData.fitness / 100);
        playerTeam.strength = Math.round(clubData.strength * fitnessMultiplier);
    }
}

/**
 * Drain squad fitness after a matchday; higher training levels reduce the drain.
 */
function drainFitness() {
    const { clubData } = gameState;
    const drain = Math.max(1, Math.round(
        GAME_CONSTANTS.FITNESS_DRAIN_PER_MATCHDAY_BASE -
        clubData.trainingLevel * GAME_CONSTANTS.FITNESS_DRAIN_REDUCTION_PER_TRAINING_LEVEL
    ));
    clubData.fitness = Math.max(GAME_CONSTANTS.FITNESS_MIN, clubData.fitness - drain);
}

/**
 * Update the league table display based on current standings
 */
export function updateLeagueTable() {
    const { leagueTable } = gameState;
    const tbody = document.getElementById('table-body');

    // Sort by points, then goal difference
    leagueTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });

    // Use DocumentFragment for batch DOM insertion (performance optimization)
    const fragment = document.createDocumentFragment();

    leagueTable.forEach((team, index) => {
        const row = document.createElement('tr');
        if (team.isPlayer) {
            row.classList.add('player-team-highlight');
        }
        if (index === 0 && team.played === (leagueTable.length - 1) * 2) {
            row.classList.add('champion');
        }

        const goalDiff = team.goalsFor - team.goalsAgainst;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${team.name}</td>
            <td>${team.played}</td>
            <td>${team.won}</td>
            <td>${team.drawn}</td>
            <td>${team.lost}</td>
            <td>${team.goalsFor}</td>
            <td>${team.goalsAgainst}</td>
            <td>${goalDiff > 0 ? '+' : ''}${goalDiff}</td>
            <td>${team.points}</td>
        `;
        fragment.appendChild(row);
    });

    // Single DOM update instead of multiple appendChild calls
    tbody.innerHTML = '';
    tbody.appendChild(fragment);
}

/**
 * Generate fixtures for the entire season using round-robin algorithm.
 * The circle method only produces (n-1) unique rounds before the rotation
 * repeats, so the second half of the season is built by mirroring the first
 * half's fixtures with home/away swapped (true "reverse fixture" second leg).
 */
export function generateFixtures() {
    const { selectedLeague, leagues } = gameState;
    gameState.fixtures = [];
    const teams = [...leagues[selectedLeague]];
    const firstHalfRounds = teams.length - 1;
    const firstHalfFixtures = [];

    // Round-robin (circle method) for the first half of the season
    for (let matchday = 1; matchday <= firstHalfRounds; matchday++) {
        const matchdayFixtures = [];
        for (let i = 0; i < teams.length / 2; i++) {
            const home = teams[i];
            const away = teams[teams.length - 1 - i];
            if (home && away) {
                matchdayFixtures.push({
                    home: home.name,
                    away: away.name,
                    played: false,
                    homeGoals: null,
                    awayGoals: null
                });
            }
        }
        firstHalfFixtures.push(matchdayFixtures);

        // Rotate teams for next matchday
        const lastTeam = teams.pop();
        teams.splice(1, 0, lastTeam);
    }

    // Second half: same pairings, home and away reversed
    const secondHalfFixtures = firstHalfFixtures.map(matchdayFixtures =>
        matchdayFixtures.map(fixture => ({
            home: fixture.away,
            away: fixture.home,
            played: false,
            homeGoals: null,
            awayGoals: null
        }))
    );

    gameState.fixtures = [...firstHalfFixtures, ...secondHalfFixtures];

    updateFixturesDisplay();
}

/**
 * Update the fixtures display in the UI
 */
export function updateFixturesDisplay() {
    const { fixtures, currentMatchday, selectedTeam } = gameState;
    const fixturesList = document.getElementById('fixtures-list');
    if (!fixturesList) return;
    
    fixturesList.innerHTML = '';

    fixtures.forEach((matchdayFixtures, matchdayIndex) => {
        const matchdayDiv = document.createElement('div');
        matchdayDiv.innerHTML = `<h4>Matchday ${matchdayIndex + 1}</h4>`;

        matchdayFixtures.forEach(fixture => {
            const fixtureDiv = document.createElement('div');
            if (fixture.played) {
                fixtureDiv.innerHTML = `${fixture.home} ${fixture.homeGoals} - ${fixture.awayGoals} ${fixture.away}`;
            } else {
                fixtureDiv.innerHTML = `${fixture.home} vs ${fixture.away}`;
            }
            matchdayDiv.appendChild(fixtureDiv);
        });

        fixturesList.appendChild(matchdayDiv);
    });

    // Update next match display
    const nextFixture = getNextPlayerFixture();
    const nextMatchDisplay = document.getElementById('next-match-display');
    const nextMatchdayHeader = document.getElementById('next-matchday-header');

    if (nextFixture && nextMatchDisplay && nextMatchdayHeader) {
        nextMatchDisplay.textContent = `${nextFixture.home} vs ${nextFixture.away}`;
        nextMatchdayHeader.textContent = `Next Matchday ${currentMatchday}`;
    } else if (nextMatchDisplay && nextMatchdayHeader) {
        nextMatchDisplay.textContent = 'Season Complete';
        nextMatchdayHeader.textContent = 'Season Complete';
    }

    updateMatchOddsDisplay(nextFixture);
}

/**
 * Show a strength comparison for the player's next fixture, so tactics are
 * chosen with visible information rather than blind dice rolls.
 * @param {Object|null} nextFixture
 */
function updateMatchOddsDisplay(nextFixture) {
    const oddsDisplay = document.getElementById('match-odds-display');
    if (!oddsDisplay) return;

    if (!nextFixture) {
        oddsDisplay.textContent = '';
        return;
    }

    const { leagueTable, selectedTeam } = gameState;
    syncPlayerStrength();

    const playerTeam = leagueTable.find(team => team.name === selectedTeam);
    const isHome = nextFixture.home === selectedTeam;
    const opponentName = isHome ? nextFixture.away : nextFixture.home;
    const opponentTeam = leagueTable.find(team => team.name === opponentName);

    if (!playerTeam || !opponentTeam) {
        oddsDisplay.textContent = '';
        return;
    }

    const diff = playerTeam.strength - opponentTeam.strength;
    let verdict;
    if (diff >= 12) {
        verdict = 'Favorite 🔺';
    } else if (diff <= -12) {
        verdict = 'Underdog 🔻';
    } else {
        verdict = 'Even Match ⚖️';
    }
    const venue = isHome ? '(Home)' : '(Away)';

    oddsDisplay.textContent =
        `Your Strength: ${playerTeam.strength} vs ${opponentName}: ${opponentTeam.strength} ${venue} — ${verdict}`;
}

/**
 * Get the next fixture involving the player's team
 * @returns {Object|null} Next fixture or null if season complete
 */
export function getNextPlayerFixture() {
    const { fixtures, selectedTeam } = gameState;
    
    for (let matchdayFixtures of fixtures) {
        for (let fixture of matchdayFixtures) {
            if (!fixture.played &&
                (fixture.home === selectedTeam || fixture.away === selectedTeam)) {
                return fixture;
            }
        }
    }
    return null;
}

/**
 * Play the next matchday
 */
export function playMatchday() {
    const nextFixture = getNextPlayerFixture();
    if (!nextFixture) {
        showWarningPopup('Season Complete', 'All matches have been played!');
        return;
    }

    const tacticSelect = document.getElementById('tactic-select');
    const tactic = tacticSelect ? tacticSelect.value : 'balanced';

    // Keep the player's league-table strength in sync with club upgrades before simulating
    syncPlayerStrength();

    // Show dice animation first
    animateDiceRoll(() => {
        // Simulate player match
        const result = simulateMatch(nextFixture, tactic);

        // Show dice results
        updateDiceDisplay(result.homeGoals, result.awayGoals);
        updateMatchEventTicker(result);

        // Simulate other matches in the same matchday
        const currentMatchdayIndex = gameState.fixtures.findIndex(matchdayFixtures =>
            matchdayFixtures.includes(nextFixture));

        gameState.fixtures[currentMatchdayIndex].forEach(fixture => {
            if (!fixture.played) {
                simulateMatch(fixture);
            }
        });

        // Calculate matchday revenue
        const matchdayFinancials = calculateMatchdayRevenue();

        // Process weekly wages for this matchday
        processWeeklyWages();

        // Squad fitness drains with every matchday played
        drainFitness();

        // Update displays
        updateLeagueTable();
        updateFixturesDisplay();
        updateUI();

        // Show match result after a delay
        setTimeout(() => {
            showMatchResult(result, matchdayFinancials);
        }, 1500);

        gameState.currentMatchday++;
        updateSidebarDisplays();

        // Auto-save after matchday
        gameState.autoSave();

        // Check if season is complete
        if (isSeasonComplete()) {
            setTimeout(() => {
                // Import and call endSeason
                import('./season-manager.js').then(module => {
                    module.endSeason();
                });
            }, 3000);
        }
    });
}

/**
 * Animate the dice roll
 * @param {Function} callback Function to call after animation
 */
function animateDiceRoll(callback) {
    const dice1 = document.getElementById('dice1');
    const dice2 = document.getElementById('dice2');

    if (dice1 && dice2) {
        // Add rolling animation
        dice1.classList.add('rolling');
        dice2.classList.add('rolling');
    }

    // Update result display
    const resultDisplay = document.getElementById('result-display');
    if (resultDisplay) {
        resultDisplay.textContent = 'Rolling dice...';
    }

    // Remove animation and execute callback after animation
    setTimeout(() => {
        if (dice1 && dice2) {
            dice1.classList.remove('rolling');
            dice2.classList.remove('rolling');
        }
        callback();
    }, 1000);
}

/**
 * Update the dice display with goals
 * @param {number} homeGoals Home team goals
 * @param {number} awayGoals Away team goals
 */
function updateDiceDisplay(homeGoals, awayGoals) {
    // Update dice faces to show the rolled values
    const dice1Faces = document.querySelectorAll('#dice1 .face');
    const dice2Faces = document.querySelectorAll('#dice2 .face');

    // Set all faces of dice1 to show home team goals
    dice1Faces.forEach(face => {
        face.textContent = homeGoals;
    });

    // Set all faces of dice2 to show away team goals
    dice2Faces.forEach(face => {
        face.textContent = awayGoals;
    });
}

/**
 * Show a brief match-event/tactic-effect ticker for the player's match
 * @param {Object} result Result object from simulateMatch
 */
function updateMatchEventTicker(result) {
    const ticker = document.getElementById('match-event-display');
    if (!ticker) return;

    if (!result.isPlayerMatch) {
        ticker.style.display = 'none';
        return;
    }

    const eventLabel = result.matchEvent ? result.matchEvent.label : null;
    const tacticLabel = describeTacticEffect(result.tacticEffect);
    const text = [eventLabel, tacticLabel].filter(Boolean).join(' ');

    if (text) {
        ticker.textContent = text;
        ticker.style.display = 'block';
    } else {
        ticker.style.display = 'none';
    }
}

/**
 * Human-readable description of a tactic's risk-profile outcome
 * @param {string|null} tacticEffect
 * @returns {string|null}
 */
function describeTacticEffect(tacticEffect) {
    switch (tacticEffect) {
        case 'attack_bonus': return 'Your all-out attack broke through for an extra goal!';
        case 'attack_concede': return 'Your all-out attack left gaps at the back — they punished it.';
        case 'attack_bonus_and_concede': return 'An end-to-end thriller from your all-out attack!';
        case 'defensive_block': return 'Your defensive setup denied them a goal!';
        case 'defensive_misfire': return 'Parking the bus blunted your own attack.';
        case 'defensive_block_and_misfire': return 'A cagey, defensive affair on both sides.';
        case 'counter_bonus': return 'A perfectly executed counter-attack caught the favorites out!';
        default: return null;
    }
}

/**
 * Simulate a match between two teams
 * @param {Object} fixture Match fixture
 * @param {string|null} playerTactic Player's selected tactic (if applicable)
 * @returns {Object} Match result
 */
export function simulateMatch(fixture, playerTactic = null) {
    const { leagueTable, selectedTeam } = gameState;
    const homeTeam = leagueTable.find(team => team.name === fixture.home);
    const awayTeam = leagueTable.find(team => team.name === fixture.away);
    const isPlayerMatch = fixture.home === selectedTeam || fixture.away === selectedTeam;
    const isHome = fixture.home === selectedTeam;

    // Roll dice for each team (0-5)
    let homeDice = rollWeightedDice();
    let awayDice = rollWeightedDice();

    // Apply team strength modifier (stronger teams get slight bonus)
    const homeStrengthBonus = Math.floor(homeTeam.strength / 20);
    const awayStrengthBonus = Math.floor(awayTeam.strength / 20);

    homeDice = clampDice(homeDice + (Math.random() < homeStrengthBonus / 10 ? 1 : 0));
    awayDice = clampDice(awayDice + (Math.random() < awayStrengthBonus / 10 ? 1 : 0));

    // Home advantage: a small extra chance of a bonus goal for the home side
    if (Math.random() < GAME_CONSTANTS.HOME_ADVANTAGE_CHANCE) {
        homeDice = clampDice(homeDice + 1);
    }

    // Apply player tactic risk profile
    let tacticEffect = null;
    if (playerTactic && isPlayerMatch) {
        const ownStrength = isHome ? homeTeam.strength : awayTeam.strength;
        const opponentStrength = isHome ? awayTeam.strength : homeTeam.strength;

        if (playerTactic === 'attacking') {
            if (Math.random() < GAME_CONSTANTS.TACTIC_ATTACK_BONUS_CHANCE) {
                if (isHome) homeDice = clampDice(homeDice + 1); else awayDice = clampDice(awayDice + 1);
                tacticEffect = 'attack_bonus';
            }
            if (Math.random() < GAME_CONSTANTS.TACTIC_ATTACK_CONCEDE_CHANCE) {
                if (isHome) awayDice = clampDice(awayDice + 1); else homeDice = clampDice(homeDice + 1);
                tacticEffect = tacticEffect ? 'attack_bonus_and_concede' : 'attack_concede';
            }
        } else if (playerTactic === 'defensive') {
            if (Math.random() < GAME_CONSTANTS.TACTIC_DEFENSIVE_BLOCK_CHANCE) {
                if (isHome) awayDice = clampDice(awayDice - 1); else homeDice = clampDice(homeDice - 1);
                tacticEffect = 'defensive_block';
            }
            if (Math.random() < GAME_CONSTANTS.TACTIC_DEFENSIVE_MISFIRE_CHANCE) {
                if (isHome) homeDice = clampDice(homeDice - 1); else awayDice = clampDice(awayDice - 1);
                tacticEffect = tacticEffect ? 'defensive_block_and_misfire' : 'defensive_misfire';
            }
        } else if (playerTactic === 'counter') {
            // Counter-attack only pays off when the player is the underdog
            if (ownStrength < opponentStrength && Math.random() < GAME_CONSTANTS.TACTIC_COUNTER_BONUS_CHANCE) {
                if (isHome) homeDice = clampDice(homeDice + 1); else awayDice = clampDice(awayDice + 1);
                tacticEffect = 'counter_bonus';
            }
        }
        // Balanced: no modification
    }

    // Rare match event, only rolled (and shown) for the player's own match
    let matchEvent = null;
    if (isPlayerMatch && Math.random() < GAME_CONSTANTS.MATCH_EVENT_CHANCE) {
        matchEvent = rollMatchEvent();
        const affectsHomeDice = (matchEvent.target === 'own' && isHome) || (matchEvent.target === 'opponent' && !isHome);
        if (affectsHomeDice) {
            homeDice = clampDice(homeDice + matchEvent.goalDelta);
        } else {
            awayDice = clampDice(awayDice + matchEvent.goalDelta);
        }
    }

    // Goals are the dice values
    const homeGoals = homeDice;
    const awayGoals = awayDice;

    fixture.homeGoals = homeGoals;
    fixture.awayGoals = awayGoals;
    fixture.played = true;

    // Update league table
    homeTeam.played++;
    awayTeam.played++;
    homeTeam.goalsFor += homeGoals;
    homeTeam.goalsAgainst += awayGoals;
    awayTeam.goalsFor += awayGoals;
    awayTeam.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
        homeTeam.won++;
        homeTeam.points += 3;
        awayTeam.lost++;
    } else if (awayGoals > homeGoals) {
        awayTeam.won++;
        awayTeam.points += 3;
        homeTeam.lost++;
    } else {
        homeTeam.drawn++;
        awayTeam.drawn++;
        homeTeam.points++;
        awayTeam.points++;
    }

    return {
        fixture: fixture,
        homeGoals: homeGoals,
        awayGoals: awayGoals,
        isPlayerMatch: isPlayerMatch,
        tacticEffect: tacticEffect,
        matchEvent: matchEvent
    };
}

/**
 * Show match result popup and update manager stats
 * @param {Object} result Match result object
 * @param {Object} matchdayFinancials Financial data from matchday
 */
export function showMatchResult(result, matchdayFinancials) {
    const { fixture, homeGoals, awayGoals, isPlayerMatch, tacticEffect, matchEvent } = result;
    const { selectedTeam, managerData, fanData } = gameState;

    if (isPlayerMatch) {
        const isWin = (fixture.home === selectedTeam && homeGoals > awayGoals) ||
            (fixture.away === selectedTeam && awayGoals > homeGoals);
        const isDraw = homeGoals === awayGoals;

        let title, message, type;
        const scoreline = `${fixture.home} ${homeGoals} - ${awayGoals} ${fixture.away}`;
        const narrative = [matchEvent ? matchEvent.label : null, describeTacticEffect(tacticEffect)]
            .filter(Boolean).join(' ');
        message = narrative ? `${scoreline}<br><br>${narrative}` : scoreline;

        if (isWin) {
            title = 'Victory!';
            type = 'success';
            managerData.reputation += 2;
            managerData.jobSecurity = Math.min(100, managerData.jobSecurity + 5);
            fanData.happiness = Math.min(100, fanData.happiness + 10);
        } else if (isDraw) {
            title = 'Draw';
            type = 'warning';
            managerData.reputation += 1;
            fanData.happiness = Math.max(0, fanData.happiness - 2);
        } else {
            title = 'Defeat';
            type = 'error';
            managerData.reputation = Math.max(0, managerData.reputation - 1);
            managerData.jobSecurity = Math.max(0, managerData.jobSecurity - 3);
            fanData.happiness = Math.max(0, fanData.happiness - 5);
        }

        showAnimatedPopup(title, message, type);

        // Show manager reading newspaper sequence, then the actual newspaper
        setTimeout(() => {
            showManagerReadingNewspaper(() => {
                showNewsModal({
                    isWin: isWin,
                    isDraw: isDraw,
                    fixture: fixture,
                    homeGoals: homeGoals,
                    awayGoals: awayGoals
                });
            });
        }, 2000);
    }

    // Update result display
    const resultDisplay = document.getElementById('result-display');
    if (resultDisplay) {
        resultDisplay.textContent = `${fixture.home} ${homeGoals} - ${awayGoals} ${fixture.away}`;
    }
}

/**
 * Show manager reading newspaper animation
 * @param {Function} callback Function to call after animation
 */
function showManagerReadingNewspaper(callback) {
    // Create manager reading newspaper overlay
    const readingOverlay = document.createElement('div');
    readingOverlay.className = 'manager-reading-overlay';
    readingOverlay.innerHTML = `
        <div class="manager-reading-content">
            <div class="manager-figure">
                <img src="manager newspaper.png" alt="Manager reading newspaper" class="manager-newspaper-image">
            </div>
            <div class="reading-text">
                <p>Manager reviewing the latest match reports...</p>
                <div class="reading-dots">
                    <span>.</span><span>.</span><span>.</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(readingOverlay);

    // Animate the reading sequence
    setTimeout(() => {
        readingOverlay.querySelector('.reading-text p').textContent = 'Analyzing team performance...';
    }, 1500);

    setTimeout(() => {
        readingOverlay.querySelector('.reading-text p').textContent = 'Checking league standings...';
    }, 3000);

    // Remove overlay and show newspaper after reading sequence
    setTimeout(() => {
        readingOverlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(readingOverlay);
            callback();
        }, 500);
    }, 4500);
}

/**
 * Show newspaper modal with match result
 * @param {Object} matchResult Match result data
 */
function showNewsModal(matchResult) {
    const { selectedLeague, selectedTeam, currentMatchday } = gameState;
    const modal = document.getElementById('news-modal');
    const title = document.getElementById('news-title');
    const roundNumber = document.getElementById('news-round-number');
    const playerHeadline = document.getElementById('news-player-headline');
    const playerArticle = document.getElementById('news-player-article');

    if (!modal || !title || !roundNumber || !playerHeadline || !playerArticle) return;

    // Set newspaper content based on match result
    title.textContent = `${selectedLeague} Gazette`;
    roundNumber.textContent = currentMatchday - 1;

    if (matchResult.isWin) {
        playerHeadline.textContent = `${selectedTeam} Triumph in Spectacular Fashion!`;
        playerArticle.textContent = `Manager's tactical brilliance shines as ${selectedTeam} secure a convincing victory. The fans are ecstatic with this performance, and the board couldn't be happier with the results.`;
    } else if (matchResult.isDraw) {
        playerHeadline.textContent = `${selectedTeam} Hold Their Ground`;
        playerArticle.textContent = `A hard-fought draw for ${selectedTeam} as they showed resilience and determination. While not the result fans hoped for, the team's fighting spirit was evident throughout the match.`;
    } else {
        playerHeadline.textContent = `${selectedTeam} Suffer Disappointing Defeat`;
        playerArticle.textContent = `Questions are being raised about the manager's tactics after ${selectedTeam}'s poor performance. Fans are growing restless, and pressure is mounting on the coaching staff.`;
    }

    modal.style.display = 'flex';
}

/**
 * Check if the season is complete
 * @returns {boolean} True if all fixtures have been played
 */
export function isSeasonComplete() {
    const { fixtures } = gameState;
    return fixtures.every(matchdayFixtures =>
        matchdayFixtures.every(fixture => fixture.played)
    );
}
