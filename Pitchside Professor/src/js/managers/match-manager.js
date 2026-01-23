/**
 * Match Manager Module
 * Handles all match-related functionality including fixtures, simulations, and results
 */

import { gameState } from '../core/game-state.js';
import { showAnimatedPopup, showWarningPopup } from '../ui/popup-manager.js';
import { calculateMatchdayRevenue, processWeeklyWages, triggerFinancialTakeover } from './finance-manager.js';
import { updateUI } from '../ui/ui-manager.js';

/**
 * Initialize the league table with all teams
 */
export function initializeLeagueTable() {
    const { selectedLeague, selectedTeam, leagues } = gameState;
    
    gameState.leagueTable = leagues[selectedLeague].map(team => ({
        name: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        strength: team.baseStrength,
        isPlayer: team.name === selectedTeam
    }));

    updateLeagueTable();
}

/**
 * Update the league table display based on current standings
 */
export function updateLeagueTable() {
    const { leagueTable } = gameState;
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    // Sort by points, then goal difference
    leagueTable.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });

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
            <td>\${index + 1}</td>
            <td>\${team.name}</td>
            <td>\${team.played}</td>
            <td>\${team.won}</td>
            <td>\${team.drawn}</td>
            <td>\${team.lost}</td>
            <td>\${team.goalsFor}</td>
            <td>\${team.goalsAgainst}</td>
            <td>\${goalDiff > 0 ? '+' : ''}\${goalDiff}</td>
            <td>\${team.points}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Generate fixtures for the entire season using round-robin algorithm
 */
export function generateFixtures() {
    const { selectedLeague, leagues } = gameState;
    gameState.fixtures = [];
    const teams = [...leagues[selectedLeague]];
    const totalMatchdays = (teams.length - 1) * 2;

    // Simple round-robin fixture generation
    for (let matchday = 1; matchday <= totalMatchdays; matchday++) {
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
        gameState.fixtures.push(matchdayFixtures);

        // Rotate teams for next matchday
        const lastTeam = teams.pop();
        teams.splice(1, 0, lastTeam);
    }

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
        matchdayDiv.innerHTML = `<h4>Matchday \${matchdayIndex + 1}</h4>`;

        matchdayFixtures.forEach(fixture => {
            const fixtureDiv = document.createElement('div');
            if (fixture.played) {
                fixtureDiv.innerHTML = `\${fixture.home} \${fixture.homeGoals} - \${fixture.awayGoals} \${fixture.away}`;
            } else {
                fixtureDiv.innerHTML = `\${fixture.home} vs \${fixture.away}`;
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
        nextMatchDisplay.textContent = `\${nextFixture.home} vs \${nextFixture.away}`;
        nextMatchdayHeader.textContent = `Next Matchday \${currentMatchday}`;
    } else if (nextMatchDisplay && nextMatchdayHeader) {
        nextMatchDisplay.textContent = 'Season Complete';
        nextMatchdayHeader.textContent = 'Season Complete';
    }
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

    // Show dice animation first
    animateDiceRoll(() => {
        // Simulate player match
        const result = simulateMatch(nextFixture, tactic);

        // Show dice results
        updateDiceDisplay(result.homeGoals, result.awayGoals);

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

        // Process weekly wages (if due)
        processWeeklyWages();

        // Check for financial takeover (rare event)
        triggerFinancialTakeover();

        // Update displays
        updateLeagueTable();
        updateFixturesDisplay();
        updateUI();

        // Show match result after a delay
        setTimeout(() => {
            showMatchResult(result, matchdayFinancials);
        }, 1500);

        gameState.currentMatchday++;

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
 * Weighted dice function (0-5, weighted toward lower values)
 * @returns {number} Dice roll result (0-5)
 */
function rollWeightedDice() {
    const weights = [35, 25, 20, 10, 7, 3]; // Percentages for 0,1,2,3,4,5
    const random = Math.random() * 100;
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
            return i;
        }
    }
    return 0; // Fallback
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

    // Roll dice for each team (0-5)
    let homeDice = rollWeightedDice();
    let awayDice = rollWeightedDice();

    // Apply team strength modifier (stronger teams get slight bonus)
    const homeStrengthBonus = Math.floor(homeTeam.strength / 20);
    const awayStrengthBonus = Math.floor(awayTeam.strength / 20);

    homeDice = Math.min(5, homeDice + (Math.random() < homeStrengthBonus / 10 ? 1 : 0));
    awayDice = Math.min(5, awayDice + (Math.random() < awayStrengthBonus / 10 ? 1 : 0));

    // Apply player tactic bonus
    if (playerTactic && (fixture.home === selectedTeam || fixture.away === selectedTeam)) {
        const isHome = fixture.home === selectedTeam;

        if (playerTactic === 'attacking') {
            // Attacking: +1 to own goals
            if (isHome) {
                homeDice = Math.min(5, homeDice + 1);
            } else {
                awayDice = Math.min(5, awayDice + 1);
            }
        } else if (playerTactic === 'defensive') {
            // Defensive: -1 to opponent's goals (minimum 0)
            if (isHome) {
                awayDice = Math.max(0, awayDice - 1);
            } else {
                homeDice = Math.max(0, homeDice - 1);
            }
        }
        // Balanced: no modification
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
        isPlayerMatch: fixture.home === selectedTeam || fixture.away === selectedTeam
    };
}

/**
 * Get tactic bonus value
 * @param {string} tactic Tactic name
 * @returns {number} Bonus value
 */
export function getTacticBonus(tactic) {
    switch (tactic) {
        case 'attacking': return 1;
        case 'defensive': return 0;
        case 'balanced':
        default: return 0;
    }
}

/**
 * Show match result popup and update manager stats
 * @param {Object} result Match result object
 * @param {Object} matchdayFinancials Financial data from matchday
 */
export function showMatchResult(result, matchdayFinancials) {
    const { fixture, homeGoals, awayGoals, isPlayerMatch } = result;
    const { selectedTeam, managerData, fanData } = gameState;

    if (isPlayerMatch) {
        const isWin = (fixture.home === selectedTeam && homeGoals > awayGoals) ||
            (fixture.away === selectedTeam && awayGoals > homeGoals);
        const isDraw = homeGoals === awayGoals;

        let title, message, type;

        if (isWin) {
            title = 'Victory!';
            message = `\${fixture.home} \${homeGoals} - \${awayGoals} \${fixture.away}`;
            type = 'success';
            managerData.reputation += 2;
            managerData.jobSecurity = Math.min(100, managerData.jobSecurity + 5);
            fanData.happiness = Math.min(100, fanData.happiness + 10);
        } else if (isDraw) {
            title = 'Draw';
            message = `\${fixture.home} \${homeGoals} - \${awayGoals} \${fixture.away}`;
            type = 'warning';
            managerData.reputation += 1;
            fanData.happiness = Math.max(0, fanData.happiness - 2);
        } else {
            title = 'Defeat';
            message = `\${fixture.home} \${homeGoals} - \${awayGoals} \${fixture.away}`;
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
        resultDisplay.textContent = `\${fixture.home} \${homeGoals} - \${awayGoals} \${fixture.away}`;
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
    title.textContent = `\${selectedLeague} Gazette`;
    roundNumber.textContent = currentMatchday - 1;

    if (matchResult.isWin) {
        playerHeadline.textContent = `\${selectedTeam} Triumph in Spectacular Fashion!`;
        playerArticle.textContent = `Manager's tactical brilliance shines as \${selectedTeam} secure a convincing victory. The fans are ecstatic with this performance, and the board couldn't be happier with the results.`;
    } else if (matchResult.isDraw) {
        playerHeadline.textContent = `\${selectedTeam} Hold Their Ground`;
        playerArticle.textContent = `A hard-fought draw for \${selectedTeam} as they showed resilience and determination. While not the result fans hoped for, the team's fighting spirit was evident throughout the match.`;
    } else {
        playerHeadline.textContent = `\${selectedTeam} Suffer Disappointing Defeat`;
        playerArticle.textContent = `Questions are being raised about the manager's tactics after \${selectedTeam}'s poor performance. Fans are growing restless, and pressure is mounting on the coaching staff.`;
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
