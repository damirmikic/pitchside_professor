/**
 * Game State Manager
 * Centralized state management for the game
 */

import { GAME_CONSTANTS } from '../data/constants.js';

class GameState {
    constructor() {
        this.currentSeason = 1;
        this.currentMatchday = 1;
        this.playerTeamData = null;
        this.isPreSeason = true;
        this.selectedLeague = null;
        this.selectedTeam = null;

        this.leagueTable = [];
        this.fixtures = [];

        this.managerData = {
            wealth: GAME_CONSTANTS.INITIAL_MANAGER_WEALTH,
            reputation: GAME_CONSTANTS.INITIAL_MANAGER_REPUTATION,
            jobSecurity: GAME_CONSTANTS.INITIAL_JOB_SECURITY,
            lifestyle: []
        };

        this.clubData = {
            finances: GAME_CONSTANTS.INITIAL_CLUB_FINANCES,
            strength: GAME_CONSTANTS.INITIAL_CLUB_STRENGTH,
            trainingLevel: 1,
            academyLevel: 1,
            stadiumLevel: GAME_CONSTANTS.STADIUM_INITIAL_LEVEL,
            stadiumCapacity: GAME_CONSTANTS.STADIUM_CAPACITY_MIN +
                Math.floor(Math.random() * (GAME_CONSTANTS.STADIUM_CAPACITY_MAX - GAME_CONSTANTS.STADIUM_CAPACITY_MIN)),
            sponsorship: null,
            weeklyWages: GAME_CONSTANTS.WEEKLY_WAGES,
            transferBudget: GAME_CONSTANTS.INITIAL_TRANSFER_BUDGET,
            seasonTicketRevenue: 0,
            matchdayRevenue: 0,
            tvRevenue: 0,
            sponsorshipOffers: []
        };

        this.fanData = {
            happiness: GAME_CONSTANTS.INITIAL_FAN_HAPPINESS,
            seasonTicketPrice: GAME_CONSTANTS.SEASON_TICKET_PRICE_DEFAULT,
            matchdayTicketPrice: GAME_CONSTANTS.MATCHDAY_TICKET_PRICE_DEFAULT,
            seasonTicketsSold: 0,
            maxSeasonTickets: GAME_CONSTANTS.MAX_SEASON_TICKETS
        };

        this.preSeasonData = {
            daysLeft: GAME_CONSTANTS.PRESEASON_DAYS,
            matchesPlayed: 0,
            maxMatches: GAME_CONSTANTS.PRESEASON_MAX_MATCHES,
            teamFitness: GAME_CONSTANTS.PRESEASON_INITIAL_FITNESS,
            teamChemistry: GAME_CONSTANTS.PRESEASON_INITIAL_CHEMISTRY,
            seasonTicketsSoldToday: 0,
            scheduledMatches: [],
            nextMatchDay: null
        };

        this.financialHistory = {
            weeklyExpenses: [],
            seasonRevenue: 0,
            lastWagePayment: 0
        };
    }

    loadFromLocalStorage() {
        this.selectedLeague = localStorage.getItem('selectedLeague');
        this.selectedTeam = localStorage.getItem('selectedTeam');
    }

    reset() {
        this.currentSeason = 1;
        this.currentMatchday = 1;
        this.isPreSeason = true;
        this.leagueTable = [];
        this.fixtures = [];
    }
}

// Singleton instance
export const gameState = new GameState();
