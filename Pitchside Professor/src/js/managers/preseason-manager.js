/**
 * Pre-Season Manager Module
 * Handles pre-season activities including friendlies, training camps, and preparation
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showAnimatedPopup, showSuccessPopup, showWarningPopup } from '../ui/notification-system.js';
import { showNotification } from '../ui/notification-system.js';
import { updateUI, openTab } from '../ui/ui-controller.js';
import { calculateSeasonTicketSales } from './finance-manager.js';

/**
 * Start the pre-season phase
 */
export function startPreSeason() {
    const { selectedTeam } = gameState;
    gameState.isPreSeason = true;

    // Show pre-season tab and hide others initially
    const preseasonTab = document.getElementById('preseason-tab');
    if (preseasonTab) {
        preseasonTab.style.display = 'block';
    }

    // Open preseason tab
    openTab(null, 'preseason');

    // Initialize season ticket sales
    calculateSeasonTicketSales();

    updatePreSeasonUI();
    showAnimatedPopup('Pre-Season Begins!',
        `Welcome to ${selectedTeam}! Use the pre-season to prepare your team, sell season tickets, and build chemistry before the league starts.`,
        'info');
}

/**
 * Update pre-season UI displays
 */
export function updatePreSeasonUI() {
    const { fanData, preSeasonData, clubData } = gameState;
    
    // Update season ticket progress
    const progress = (fanData.seasonTicketsSold / fanData.maxSeasonTickets) * 100;
    const ticketProgress = document.getElementById('season-ticket-progress');
    const ticketProgressBar = document.getElementById('season-ticket-progress-bar');
    
    if (ticketProgress) {
        ticketProgress.textContent = `Tickets Sold: ${fanData.seasonTicketsSold.toLocaleString()} / ${fanData.maxSeasonTickets.toLocaleString()}`;
    }
    if (ticketProgressBar) {
        ticketProgressBar.style.width = `${progress}%`;
    }

    // Update pre-season matches
    const matchesInfo = document.getElementById('preseason-matches-info');
    if (matchesInfo) {
        matchesInfo.textContent = `Matches Played: ${preSeasonData.matchesPlayed} / ${preSeasonData.maxMatches}`;
    }

    // Update team stats
    const teamFitness = document.getElementById('team-fitness');
    const teamChemistry = document.getElementById('team-chemistry');
    
    if (teamFitness) {
        teamFitness.textContent = `${preSeasonData.teamFitness}%`;
    }
    if (teamChemistry) {
        teamChemistry.textContent = `${preSeasonData.teamChemistry}%`;
    }

    // Update days left
    const daysLeft = document.getElementById('preseason-days-left');
    if (daysLeft) {
        daysLeft.textContent = `Days until season: ${preSeasonData.daysLeft}`;
    }

    // Show/hide buttons based on state
    const playMatchBtn = document.getElementById('play-preseason-match-btn');
    const startSeasonBtn = document.getElementById('start-season-btn');
    const advanceBtn = document.getElementById('advance-preseason-btn');

    if (playMatchBtn && preSeasonData.matchesPlayed >= preSeasonData.maxMatches) {
        playMatchBtn.style.display = 'none';
    } else if (playMatchBtn) {
        playMatchBtn.style.display = 'block';
    }

    if (startSeasonBtn && advanceBtn) {
        if (preSeasonData.daysLeft <= 0) {
            startSeasonBtn.style.display = 'block';
            advanceBtn.style.display = 'none';
        } else {
            startSeasonBtn.style.display = 'none';
        }
    }

    updateUI();
}

/**
 * Schedule a friendly match
 */
export function scheduleFriendlyMatch() {
    const { preSeasonData, selectedLeague, leagues } = gameState;
    
    if (preSeasonData.matchesPlayed >= preSeasonData.maxMatches) {
        showNotification('Schedule Match', 'You have already played all available pre-season friendlies.', 'warning');
        return;
    }
    
    if (preSeasonData.scheduledMatches.length >= 3) {
        showNotification('Schedule Match', 'You can only schedule 3 matches maximum.', 'warning');
        return;
    }
    
    // Schedule match for 2-5 days from now
    const daysAhead = Math.floor(Math.random() * 4) + 2;
    const matchDay = Math.max(1, preSeasonData.daysLeft - daysAhead);
    
    if (matchDay <= 0) {
        showNotification('Schedule Match', 'Not enough time left to schedule more matches.', 'warning');
        return;
    }
    
    // Generate opponent from other leagues (using the shared league data, not a duplicated copy)
    const otherLeagueTeams = [];
    Object.keys(leagues).forEach(leagueName => {
        if (leagueName !== selectedLeague) {
            otherLeagueTeams.push(...leagues[leagueName]);
        }
    });
    
    const opponentTeam = otherLeagueTeams[Math.floor(Math.random() * otherLeagueTeams.length)];
    
    const scheduledMatch = {
        day: matchDay,
        opponent: opponentTeam.name,
        opponentStrength: opponentTeam.baseStrength,
        played: false
    };
    
    preSeasonData.scheduledMatches.push(scheduledMatch);
    preSeasonData.scheduledMatches.sort((a, b) => b.day - a.day);
    
    showNotification('Match Scheduled', `Friendly vs ${opponentTeam.name} scheduled for day ${matchDay}!`, 'success');
    updateScheduledMatchesUI();
    updateAllSectionUIs();
}

/**
 * Play a pre-season match
 */
export function playPreSeasonMatch() {
    const { preSeasonData, selectedTeam } = gameState;
    
    // Check if there's a match scheduled for today
    const todayMatch = preSeasonData.scheduledMatches.find(match => 
        match.day === preSeasonData.daysLeft && !match.played
    );
    
    if (!todayMatch) {
        showNotification('No Match Today', 'No friendly match scheduled for today.', 'warning');
        return;
    }

    // Use the scheduled opponent
    const opponent = todayMatch.opponent;

    // Simulate match with current fitness/chemistry affecting performance
    const fitnessBonus = (preSeasonData.teamFitness - 75) / 100;
    const chemistryBonus = (preSeasonData.teamChemistry - 60) / 100;
    const totalBonus = fitnessBonus + chemistryBonus;

    const playerScore = Math.max(0, Math.floor(Math.random() * 4 + totalBonus));
    const opponentScore = Math.floor(Math.random() * 3);

    // Mark match as played
    todayMatch.played = true;
    preSeasonData.matchesPlayed++;
    preSeasonData.teamFitness = Math.min(100, preSeasonData.teamFitness + 5);
    preSeasonData.teamChemistry = Math.min(100, preSeasonData.teamChemistry + 8);

    const result = playerScore > opponentScore ? 'won' :
        playerScore === opponentScore ? 'drew' : 'lost';

    showAnimatedPopup('Pre-Season Result',
        `${selectedTeam} ${playerScore} - ${opponentScore} ${opponent}\n\nYou ${result} the friendly match!\n\nTeam fitness and chemistry improved.\n\nDays remaining: ${preSeasonData.daysLeft}`,
        result === 'won' ? 'success' : 'info');

    updatePreSeasonUI();
    updateScheduledMatchesUI();
    updateAllSectionUIs();
}

/**
 * Update scheduled matches UI
 */
export function updateScheduledMatchesUI() {
    const { preSeasonData } = gameState;
    const scheduledList = document.getElementById('scheduled-matches-list');
    if (!scheduledList) return;
    
    if (preSeasonData.scheduledMatches.length === 0) {
        scheduledList.innerHTML = 'No matches scheduled';
        return;
    }
    
    const upcomingMatches = preSeasonData.scheduledMatches
        .filter(match => !match.played)
        .sort((a, b) => b.day - a.day);
    
    if (upcomingMatches.length === 0) {
        scheduledList.innerHTML = 'All scheduled matches completed';
        return;
    }
    
    scheduledList.innerHTML = upcomingMatches.map(match => 
        `<div class="scheduled-match">
            <strong>Day ${match.day}:</strong> vs ${match.opponent}
            ${match.day === preSeasonData.daysLeft ? ' <span class="today-match">(TODAY!)</span>' : ''}
        </div>`
    ).join('');
    
    // Show/hide play button based on whether there's a match today
    const playBtn = document.getElementById('play-friendly-btn');
    const scheduleBtn = document.getElementById('schedule-friendly-btn');
    const todayMatch = upcomingMatches.find(match => match.day === preSeasonData.daysLeft);
    
    if (playBtn && scheduleBtn) {
        if (todayMatch) {
            playBtn.style.display = 'inline-block';
            scheduleBtn.style.display = 'none';
        } else {
            playBtn.style.display = 'none';
            scheduleBtn.style.display = 'inline-block';
        }
    }
}

/**
 * Run a training camp
 */
export function runTrainingCamp() {
    const { clubData, preSeasonData } = gameState;
    const cost = 10000;
    
    if (clubData.finances >= cost) {
        clubData.finances -= cost;
        preSeasonData.teamFitness = Math.min(100, preSeasonData.teamFitness + 15);
        preSeasonData.teamChemistry = Math.min(100, preSeasonData.teamChemistry + 10);

        showSuccessPopup('Training Camp Complete!',
            'Intensive training has improved team fitness and chemistry significantly.');
        updatePreSeasonUI();
    } else {
        showWarningPopup('Insufficient Funds', `You need $${cost.toLocaleString()} for a training camp.`);
    }
}

/**
 * Advance pre-season by one day
 */
export function advancePreSeasonDay() {
    const { preSeasonData, fanData, clubData } = gameState;
    
    if (preSeasonData.daysLeft <= 0) return;

    preSeasonData.daysLeft--;
    
    // Check if there's a match scheduled for the new day
    const todayMatch = preSeasonData.scheduledMatches.find(match => 
        match.day === preSeasonData.daysLeft && !match.played
    );
    
    if (todayMatch) {
        showNotification('Match Day!', `Today is your friendly match vs ${todayMatch.opponent}!`, 'info');
    }

    // Sell some season tickets each day
    const dailySales = Math.floor(Math.random() * (fanData.maxSeasonTickets * 0.1)) + 1;
    const newSales = Math.min(dailySales, fanData.maxSeasonTickets - fanData.seasonTicketsSold);
    fanData.seasonTicketsSold += newSales;
    preSeasonData.seasonTicketsSoldToday = newSales;

    // Add season ticket revenue
    clubData.finances += newSales * fanData.seasonTicketPrice;

    if (newSales > 0) {
        showAnimatedPopup('Season Tickets Sold!',
            `${newSales} season tickets sold today for $${(newSales * fanData.seasonTicketPrice).toLocaleString()}`,
            'success');
    }

    updatePreSeasonUI();
    updateScheduledMatchesUI();
    updateAllSectionUIs();
}

/**
 * Finish pre-season and start the league season
 */
export function finishPreSeason() {
    const { preSeasonData, clubData, selectedLeague } = gameState;
    gameState.isPreSeason = false;

    // Hide pre-season tab
    const preseasonTab = document.getElementById('preseason-tab');
    if (preseasonTab) {
        preseasonTab.style.display = 'none';
    }

    // Team chemistry built in pre-season is a lasting bonus to team strength
    const chemistryBonus = Math.floor((preSeasonData.teamChemistry - 60) / 4);
    clubData.strength += chemistryBonus;

    // Fitness carries into the season as a depleting resource rather than a
    // one-time bonus: it drains with each matchday and is protected by training
    clubData.fitness = Math.max(GAME_CONSTANTS.FITNESS_MIN, Math.min(GAME_CONSTANTS.FITNESS_MAX, preSeasonData.teamFitness));

    // Switch to manager tab
    openTab(null, 'manager');

    updateUI();

    showAnimatedPopup('Season Begins!',
        `Pre-season complete! Your team gained ${chemistryBonus} strength points from team chemistry, and starts the season at ${clubData.fitness}% fitness.\n\nGood luck in the ${selectedLeague}!`,
        'success');
}

/**
 * Organize a training camp (alternative implementation)
 */
export function organizeTrainingCamp() {
    const { preSeasonData, clubData } = gameState;
    
    if (preSeasonData.daysLeft < 3) {
        showNotification('Training Camp', 'Not enough time left for a training camp!', 'warning');
        return;
    }
    
    // Cost money but improve fitness and chemistry
    const cost = 5000;
    if (clubData.finances < cost) {
        showNotification('Training Camp', 'Not enough funds for a training camp!', 'error');
        return;
    }
    
    clubData.finances -= cost;
    preSeasonData.teamFitness = Math.min(100, preSeasonData.teamFitness + 10);
    preSeasonData.teamChemistry = Math.min(100, preSeasonData.teamChemistry + 15);
    preSeasonData.daysLeft -= 3;
    
    showNotification('Training Camp', 'Successful training camp! Team fitness and chemistry improved.', 'success');
    updateAllSectionUIs();
}

/**
 * Update all section UIs (placeholder for full UI update)
 */
function updateAllSectionUIs() {
    // This would call the main updateAllSectionUIs from ui-manager
    if (typeof window.updateAllSectionUIs === 'function') {
        window.updateAllSectionUIs();
    }
    updateUI();
}
