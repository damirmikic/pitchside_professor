/**
 * Main Application Entry Point
 * Initializes the game and sets up all event listeners
 */

// Import core modules
import { gameState } from './core/state-manager.js';
import { leagues } from './data/leagues.js';

// Import utility modules
import { validateTicketPrice } from './utils/input-validator.js';
import { sanitizeNumber } from './utils/input-sanitizer.js';
import { downloadSaveFile, uploadSaveFile, quickSave, quickLoad } from './utils/save-manager.js';

// Import UI modules
import {
    updateUI,
    updateSidebarDisplays,
    updateAllSectionUIs,
    updateFinancialUI,
    toggleMobileSidebar,
    openTab,
    openWorldTab,
    updateSeasonTicketDisplay
} from './ui/ui-controller.js';

import {
    showAnimatedPopup,
    closePopup,
    showSuccessPopup,
    showWarningPopup,
    showErrorPopup,
    showConfirmPopup,
    showNotification
} from './ui/notification-system.js';

// Import manager modules
import {
    initializeLeagueTable,
    updateLeagueTable,
    generateFixtures,
    updateFixturesDisplay,
    playMatchday,
    isSeasonComplete
} from './managers/match-manager.js';

import {
    initializeFinancialSystem,
    calculateSeasonTicketSales,
    showSponsorshipOffers,
    showFinancialReport
} from './managers/finance-manager.js';

import {
    upgradeTraining,
    upgradeAcademy,
    expandStadium,
    upgradeConcessions,
    upgradeStore
} from './managers/club-manager.js';

import {
    runPromotion,
    holdPressConference
} from './managers/fan-manager.js';

import {
    startPreSeason,
    scheduleFriendlyMatch,
    playPreSeasonMatch,
    advancePreSeasonDay,
    finishPreSeason,
    runTrainingCamp,
    organizeTrainingCamp
} from './managers/preseason-manager.js';

import {
    endSeason,
    startNewSeason
} from './managers/season-manager.js';

import {
    initializeLifestyle,
    purchaseLifestyleItem,
    updateLifestyleUI
} from './managers/lifestyle-manager.js';

/**
 * Initialize the game
 */
function startGame() {
    // Add body class to indicate game has started
    document.body.classList.add('game-started');

    // Show game page
    const gamePage = document.getElementById('page-game');
    if (gamePage) {
        gamePage.classList.add('active');
        gamePage.style.display = '';
        gamePage.style.visibility = '';
    }

    // Set up player team data
    gameState.playerTeamData = leagues[gameState.selectedLeague].find(
        team => team.name === gameState.selectedTeam
    );
    gameState.clubData.strength = gameState.playerTeamData.baseStrength * 10;

    // Update header
    const managingTeamHeader = document.getElementById('managing-team-header');
    if (managingTeamHeader) {
        managingTeamHeader.textContent = `Managing: ${gameState.selectedTeam}`;
    }

    // Initialize game systems
    initializeLeagueTable();
    generateFixtures();
    initializeFinancialSystem();
    setupEventListeners();

    // Start in pre-season mode
    startPreSeason();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Main action button (Play Matchday)
    const mainActionBtn = document.getElementById('main-action-btn');
    if (mainActionBtn) {
        mainActionBtn.addEventListener('click', playMatchday);
    }

    // Ticket price sliders with validation
    const seasonTicketSlider = document.getElementById('season-ticket-price-slider');
    if (seasonTicketSlider) {
        seasonTicketSlider.addEventListener('input', function () {
            const sanitized = sanitizeNumber(this.value);
            const validation = validateTicketPrice(sanitized);

            if (validation.valid) {
                gameState.fanData.seasonTicketPrice = validation.sanitized;
                const valueDisplay = document.getElementById('season-ticket-price-value');
                if (valueDisplay) {
                    valueDisplay.textContent = `$${validation.sanitized}`;
                }
                updateUI();
            } else {
                console.warn('Invalid season ticket price:', validation.error);
            }
        });
    }

    const matchdayTicketSlider = document.getElementById('matchday-ticket-price-slider');
    if (matchdayTicketSlider) {
        matchdayTicketSlider.addEventListener('input', function () {
            const sanitized = sanitizeNumber(this.value);
            const validation = validateTicketPrice(sanitized);

            if (validation.valid) {
                gameState.fanData.matchdayTicketPrice = validation.sanitized;
                const valueDisplay = document.getElementById('matchday-ticket-price-value');
                if (valueDisplay) {
                    valueDisplay.textContent = `$${validation.sanitized}`;
                }
                updateUI();
            } else {
                console.warn('Invalid matchday ticket price:', validation.error);
            }
        });
    }

    // Club development buttons
    const upgradeTrainingBtn = document.getElementById('upgrade-training-btn');
    if (upgradeTrainingBtn) {
        upgradeTrainingBtn.addEventListener('click', () => upgradeTraining());
    }

    const upgradeAcademyBtn = document.getElementById('upgrade-academy-btn');
    if (upgradeAcademyBtn) {
        upgradeAcademyBtn.addEventListener('click', () => upgradeAcademy());
    }

    const seekSponsorshipBtn = document.getElementById('seek-sponsorship-btn');
    if (seekSponsorshipBtn) {
        seekSponsorshipBtn.addEventListener('click', () => showSponsorshipOffers());
    }

    const financialReportBtn = document.getElementById('financial-report-btn');
    if (financialReportBtn) {
        financialReportBtn.addEventListener('click', () => showFinancialReport());
    }

    // Fan engagement buttons
    const runRadioPromoBtn = document.getElementById('run-radio-promo-btn');
    if (runRadioPromoBtn) {
        runRadioPromoBtn.addEventListener('click', () => runPromotion('radio'));
    }

    const runTvPromoBtn = document.getElementById('run-tv-promo-btn');
    if (runTvPromoBtn) {
        runTvPromoBtn.addEventListener('click', () => runPromotion('tv'));
    }

    const buyNewspaperAdBtn = document.getElementById('buy-newspaper-ad-btn');
    if (buyNewspaperAdBtn) {
        buyNewspaperAdBtn.addEventListener('click', () => runPromotion('newspaper'));
    }

    // Stadium hotspot buttons
    const hotspotStand = document.getElementById('hotspot-stand');
    if (hotspotStand) {
        hotspotStand.addEventListener('click', () => expandStadium());
    }

    const hotspotConcessions = document.getElementById('hotspot-concessions');
    if (hotspotConcessions) {
        hotspotConcessions.addEventListener('click', () => upgradeConcessions());
    }

    const hotspotStore = document.getElementById('hotspot-store');
    if (hotspotStore) {
        hotspotStore.addEventListener('click', () => upgradeStore());
    }

    // Modal close buttons
    const newsCloseBtn = document.getElementById('news-close-btn');
    if (newsCloseBtn) {
        newsCloseBtn.addEventListener('click', () => {
            const modal = document.getElementById('news-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Pre-season buttons
    const playPreseasonMatchBtn = document.getElementById('play-preseason-match-btn');
    if (playPreseasonMatchBtn) {
        playPreseasonMatchBtn.addEventListener('click', () => playPreSeasonMatch());
    }

    const trainingCampBtn = document.getElementById('training-camp-btn');
    if (trainingCampBtn) {
        trainingCampBtn.addEventListener('click', () => runTrainingCamp());
    }

    const advancePreseasonBtn = document.getElementById('advance-preseason-btn');
    if (advancePreseasonBtn) {
        advancePreseasonBtn.addEventListener('click', () => advancePreSeasonDay());
    }

    const startSeasonBtn = document.getElementById('start-season-btn');
    if (startSeasonBtn) {
        startSeasonBtn.addEventListener('click', () => finishPreSeason());
    }

    // Save/Load buttons
    const quickSaveBtn = document.getElementById('quick-save-btn');
    if (quickSaveBtn) {
        quickSaveBtn.addEventListener('click', () => {
            if (quickSave()) {
                showNotification('Game saved successfully!', 'success');
            } else {
                showNotification('Failed to save game', 'error');
            }
        });
    }

    const quickLoadBtn = document.getElementById('quick-load-btn');
    if (quickLoadBtn) {
        quickLoadBtn.addEventListener('click', () => {
            if (quickLoad()) {
                showNotification('Game loaded successfully!', 'success');
                updateUI();
                updateAllSectionUIs();
            } else {
                showNotification('No save file found', 'error');
            }
        });
    }

    const exportSaveBtn = document.getElementById('export-save-btn');
    if (exportSaveBtn) {
        exportSaveBtn.addEventListener('click', () => {
            if (downloadSaveFile()) {
                showNotification('Save file exported successfully!', 'success');
            } else {
                showNotification('Failed to export save file', 'error');
            }
        });
    }

    const importSaveBtn = document.getElementById('import-save-btn');
    if (importSaveBtn) {
        importSaveBtn.addEventListener('click', () => {
            uploadSaveFile(
                (filename) => {
                    showNotification(`Loaded save file: ${filename}`, 'success');
                    updateUI();
                    updateAllSectionUIs();
                },
                (error) => {
                    showNotification('Failed to load save file', 'error');
                    console.error(error);
                }
            );
        });
    }
}

/**
 * Initialize sidebar navigation
 */
function initializeSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Hide all sections
            const sections = document.querySelectorAll('main > section');
            sections.forEach(section => {
                section.style.display = 'none';
            });

            // Show selected section
            const sectionId = this.getAttribute('data-section');
            const selectedSection = document.getElementById(sectionId);
            if (selectedSection) {
                selectedSection.style.display = 'block';
            }

            // Update all UIs when switching sections
            updateUI();
            updateSidebarDisplays();
            updateAllSectionUIs();
            updateFinancialUI();

            // Close mobile sidebar after selection
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    });
}

/**
 * Populate champions view (World tab)
 */
function populateChampionsView() {
    const championsContent = document.getElementById('champions-content');
    if (championsContent) {
        championsContent.innerHTML = '<p>No champions data available yet. Complete a season to see results!</p>';
    }
}

// Make functions available globally for inline onclick handlers
window.openTab = openTab;
window.openWorldTab = openWorldTab;
window.toggleMobileSidebar = toggleMobileSidebar;
window.holdPressConference = holdPressConference;
window.scheduleFriendlyMatch = scheduleFriendlyMatch;
window.playFriendlyMatch = playPreSeasonMatch; // Alias
window.organizeTrainingCamp = organizeTrainingCamp;
window.advancePreSeasonDay = advancePreSeasonDay;
window.populateChampionsView = populateChampionsView;

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load team selection from localStorage
    gameState.loadFromLocalStorage();

    if (!gameState.selectedLeague || !gameState.selectedTeam) {
        window.location.href = 'intro.html';
        return;
    }

    // Update team name in header immediately
    const managingTeamHeader = document.getElementById('managing-team-header');
    if (managingTeamHeader) {
        managingTeamHeader.textContent = `Managing: ${gameState.selectedTeam}`;
    }

    // Initialize sidebar and lifestyle system
    initializeSidebar();
    initializeLifestyle();

    // Start the game
    startGame();
});
