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
import { eventManager } from './utils/event-manager.js';

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
    isSeasonComplete,
    setInstantResults,
    isInstantResultsEnabled
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
    playPreSeasonMatch,
    advancePreSeasonDay,
    finishPreSeason,
    runTrainingCamp,
    updatePreSeasonUI
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

import {
    setBoardExpectation
} from './managers/board-manager.js';

import {
    playChampionsCupRound,
    renderChampionsCupUI
} from './managers/champions-cup-manager.js';

import {
    renderCareerSummary
} from './managers/career-manager.js';

import {
    initializeSquad,
    generateTransferListings,
    renderSquad,
    renderTransferMarket
} from './managers/squad-manager.js';

/**
 * Global safety net: an uncaught exception or rejected promise mid-game would
 * otherwise silently freeze the page with no feedback and no chance to save.
 * Best-effort only -- this is not a substitute for fixing the underlying bug.
 * Only the first error surfaces a notice per page load, to avoid flooding the
 * popup queue if something is failing repeatedly.
 */
let hasShownErrorNotice = false;
function handleUnexpectedError(error) {
    console.error('Unexpected error:', error);

    let saved = false;
    try {
        saved = gameState.autoSave();
    } catch (saveError) {
        console.error('Autosave during error handling also failed:', saveError);
    }

    if (hasShownErrorNotice) return;
    hasShownErrorNotice = true;

    showErrorPopup(
        'Something Went Wrong',
        saved
            ? 'An unexpected error occurred. Your progress has been saved -- reloading the page is recommended.'
            : 'An unexpected error occurred and your progress could not be saved. Reloading the page is recommended.'
    );
}

window.addEventListener('error', (event) => handleUnexpectedError(event.error || event.message));
window.addEventListener('unhandledrejection', (event) => handleUnexpectedError(event.reason));

/**
 * Initialize game state and systems for the current club (gameState.selectedLeague/selectedTeam).
 * Called on first load, and again after accepting a new job from the job board.
 */
export function initializeGame() {
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
    setBoardExpectation();
    updateSidebarDisplays();
    renderChampionsCupUI();
    renderCareerSummary();
    initializeSquad();
    generateTransferListings();

    // Start in pre-season mode
    startPreSeason();
}

/**
 * Initialize the game on first load: game state plus one-time event listener setup.
 */
function startGame() {
    initializeGame();
    setupEventListeners();
}

/**
 * Resume a career from the autosave slot instead of starting fresh. Skips
 * every fresh-state generation step in initializeGame() (league table,
 * fixtures, squad, transfer listings, pre-season reset) since those would
 * overwrite the state we just restored -- this only reveals the game page
 * and re-renders every display from what deserializeState() populated.
 */
function resumeGame() {
    const restored = gameState.loadFullGameState('autosave');
    if (!restored) {
        showErrorPopup('Restore Failed', 'Your saved career could not be loaded -- starting a new career instead.');
        startGame();
        return;
    }

    document.body.classList.add('game-started');
    const gamePage = document.getElementById('page-game');
    if (gamePage) {
        gamePage.classList.add('active');
        gamePage.style.display = '';
        gamePage.style.visibility = '';
    }

    const managingTeamHeader = document.getElementById('managing-team-header');
    if (managingTeamHeader) {
        managingTeamHeader.textContent = `Managing: ${gameState.selectedTeam}`;
    }

    updateUI();
    updateSidebarDisplays();
    updateAllSectionUIs();
    updateFinancialUI();
    updateLeagueTable();
    updateFixturesDisplay();
    renderChampionsCupUI();
    renderCareerSummary();
    renderSquad();
    renderTransferMarket();
    updateLifestyleUI();

    if (gameState.isPreSeason) {
        const preseasonTab = document.getElementById('preseason-tab');
        if (preseasonTab) preseasonTab.style.display = 'block';
        openTab(null, 'preseason');
        updatePreSeasonUI();
    } else {
        openTab(null, 'manager');
    }

    setupEventListeners();
    showNotification('Career restored', 'success');
}

/**
 * Set up all event listeners using EventManager for proper cleanup
 */
function setupEventListeners() {
    // Main action button (Play Matchday)
    const mainActionBtn = document.getElementById('main-action-btn');
    eventManager.addEventListener(mainActionBtn, 'click', playMatchday);

    // Instant Results toggle: initialize from the persisted preference, and
    // let the player flip it on/off between matchdays
    const instantResultsToggle = document.getElementById('instant-results-toggle');
    if (instantResultsToggle) {
        instantResultsToggle.checked = isInstantResultsEnabled();
        eventManager.addEventListener(instantResultsToggle, 'change', function () {
            setInstantResults(this.checked);
        });
    }

    // Mobile sidebar toggle
    const mobileMenuToggleBtn = document.getElementById('mobile-menu-toggle-btn');
    eventManager.addEventListener(mobileMenuToggleBtn, 'click', () => toggleMobileSidebar());

    // Press conference
    const pressConferenceBtn = document.getElementById('press-conference-btn');
    eventManager.addEventListener(pressConferenceBtn, 'click', () => holdPressConference());

    // Manager-section tabs (Manager/Club/Fans & Media/Pre-Season/World)
    document.querySelectorAll('#management-section [data-tab]').forEach(button => {
        eventManager.addEventListener(button, 'click', (e) => openTab(e, button.dataset.tab));
    });

    // World-section sub-tabs (Current Standings/Past Champions)
    document.querySelectorAll('#world [data-world-tab]').forEach(button => {
        eventManager.addEventListener(button, 'click', (e) => openWorldTab(e, button.dataset.worldTab));
    });

    // Ticket price sliders with validation
    const seasonTicketSlider = document.getElementById('season-ticket-price-slider');
    if (seasonTicketSlider) {
        eventManager.addEventListener(seasonTicketSlider, 'input', function () {
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
        eventManager.addEventListener(matchdayTicketSlider, 'input', function () {
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
    eventManager.addEventListener(upgradeTrainingBtn, 'click', () => upgradeTraining());

    const upgradeAcademyBtn = document.getElementById('upgrade-academy-btn');
    eventManager.addEventListener(upgradeAcademyBtn, 'click', () => upgradeAcademy());

    const seekSponsorshipBtn = document.getElementById('seek-sponsorship-btn');
    eventManager.addEventListener(seekSponsorshipBtn, 'click', () => showSponsorshipOffers());

    const financialReportBtn = document.getElementById('financial-report-btn');
    eventManager.addEventListener(financialReportBtn, 'click', () => showFinancialReport());

    // Fan engagement buttons
    const runRadioPromoBtn = document.getElementById('run-radio-promo-btn');
    eventManager.addEventListener(runRadioPromoBtn, 'click', () => runPromotion('radio'));

    const runTvPromoBtn = document.getElementById('run-tv-promo-btn');
    eventManager.addEventListener(runTvPromoBtn, 'click', () => runPromotion('tv'));

    const buyNewspaperAdBtn = document.getElementById('buy-newspaper-ad-btn');
    eventManager.addEventListener(buyNewspaperAdBtn, 'click', () => runPromotion('newspaper'));

    // Stadium hotspot buttons
    const hotspotStand = document.getElementById('hotspot-stand');
    eventManager.addEventListener(hotspotStand, 'click', () => expandStadium());

    const hotspotConcessions = document.getElementById('hotspot-concessions');
    eventManager.addEventListener(hotspotConcessions, 'click', () => upgradeConcessions());

    const hotspotStore = document.getElementById('hotspot-store');
    eventManager.addEventListener(hotspotStore, 'click', () => upgradeStore());

    // Champions Cup
    const playChampionsCupRoundBtn = document.getElementById('play-champions-cup-round-btn');
    eventManager.addEventListener(playChampionsCupRoundBtn, 'click', () => playChampionsCupRound());

    // Modal close buttons
    const newsCloseBtn = document.getElementById('news-close-btn');
    if (newsCloseBtn) {
        eventManager.addEventListener(newsCloseBtn, 'click', () => {
            const modal = document.getElementById('news-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Pre-season buttons
    const playPreseasonMatchBtn = document.getElementById('play-preseason-match-btn');
    eventManager.addEventListener(playPreseasonMatchBtn, 'click', () => playPreSeasonMatch());

    const trainingCampBtn = document.getElementById('training-camp-btn');
    eventManager.addEventListener(trainingCampBtn, 'click', () => runTrainingCamp());

    const advancePreseasonBtn = document.getElementById('advance-preseason-btn');
    eventManager.addEventListener(advancePreseasonBtn, 'click', () => advancePreSeasonDay());

    const startSeasonBtn = document.getElementById('start-season-btn');
    eventManager.addEventListener(startSeasonBtn, 'click', () => finishPreSeason());

    // Save/Load buttons
    const quickSaveBtn = document.getElementById('quick-save-btn');
    if (quickSaveBtn) {
        eventManager.addEventListener(quickSaveBtn, 'click', () => {
            if (quickSave()) {
                showNotification('Game saved successfully!', 'success');
            } else {
                showNotification('Failed to save game', 'error');
            }
        });
    }

    const quickLoadBtn = document.getElementById('quick-load-btn');
    if (quickLoadBtn) {
        eventManager.addEventListener(quickLoadBtn, 'click', () => {
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
        eventManager.addEventListener(exportSaveBtn, 'click', () => {
            if (downloadSaveFile()) {
                showNotification('Save file exported successfully!', 'success');
            } else {
                showNotification('Failed to export save file', 'error');
            }
        });
    }

    const importSaveBtn = document.getElementById('import-save-btn');
    if (importSaveBtn) {
        eventManager.addEventListener(importSaveBtn, 'click', () => {
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
 * Initialize sidebar navigation using EventManager
 */
function initializeSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');

    sidebarLinks.forEach(link => {
        eventManager.addEventListener(link, 'click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Hide every sidebar-navigable section (derived from the sidebar's own
            // data-section targets, not DOM depth -- the sections sit two levels
            // under <main>, at the same depth as the always-visible tab controls
            // in #management-section, so a structural selector would hide those too)
            sidebarLinks.forEach(l => {
                const section = document.getElementById(l.getAttribute('data-section'));
                if (section) section.style.display = 'none';
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
            renderSquad();
            renderTransferMarket();

            // Close mobile sidebar after selection
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    });
}

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

    // If there's an autosave for the exact career currently selected, offer
    // to continue it instead of silently starting over -- a fresh pick from
    // intro.html (different team/league) always proceeds as a new career
    const autosave = gameState.getSaveSlots().find(slot => slot.slotName === 'autosave');
    const matchesCurrentCareer = autosave &&
        autosave.league === gameState.selectedLeague &&
        autosave.team === gameState.selectedTeam;

    if (matchesCurrentCareer) {
        showAnimatedPopup(
            'Welcome Back',
            `You have a saved career with ${autosave.team} (Season ${autosave.season}). Continue where you left off, or start a brand-new career? Starting new will erase this save.`,
            'info',
            [
                { text: 'Continue Career', action: () => resumeGame() },
                { text: 'Start New Career', action: () => { gameState.deleteSaveSlot('autosave'); startGame(); } }
            ]
        );
    } else {
        startGame();
    }
});
