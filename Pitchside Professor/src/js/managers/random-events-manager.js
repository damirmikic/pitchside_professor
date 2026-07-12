/**
 * Random Events Manager Module
 * Periodically presents a small two-choice decision between matchdays,
 * trading money against fan happiness, reputation, job security, or fitness.
 */

import { gameState } from '../core/state-manager.js';
import { GAME_CONSTANTS } from '../data/constants.js';
import { showAnimatedPopup } from '../ui/notification-system.js';
import { updateUI } from '../ui/ui-controller.js';

const RANDOM_EVENTS = [
    {
        title: 'Sponsor Request',
        description: 'A sponsor wants extra branding on the kit for a fee, but fans worry about "selling out."',
        optionA: { label: 'Accept the deal (+$15,000, -5 fan happiness)', effects: { finances: 15000, happiness: -5 } },
        optionB: { label: 'Decline', effects: {} }
    },
    {
        title: 'Star Player Interview',
        description: 'Your star player wants to speak to the press about their ambitions elsewhere.',
        optionA: { label: 'Let them speak freely (+3 reputation, -5 job security)', effects: { reputation: 3, jobSecurity: -5 } },
        optionB: { label: 'Ask them to stay quiet (-2 fan happiness)', effects: { happiness: -2 } }
    },
    {
        title: 'Weather Warning',
        description: 'A storm threatens to disrupt training this week.',
        optionA: { label: 'Pay for indoor facilities (-$8,000)', effects: { finances: -8000 } },
        optionB: { label: 'Train outside anyway (-5 fitness)', effects: { fitness: -5 } }
    },
    {
        title: 'Fan Protest',
        description: 'A fan group is protesting ticket prices outside the stadium.',
        optionA: { label: 'Lower prices temporarily (-$10,000, +8 fan happiness)', effects: { finances: -10000, happiness: 8 } },
        optionB: { label: 'Hold firm (-5 fan happiness)', effects: { happiness: -5 } }
    },
    {
        title: 'Charity Request',
        description: 'A local charity has asked the club for a donation.',
        optionA: { label: 'Donate generously (-$5,000, +5 reputation)', effects: { finances: -5000, reputation: 5 } },
        optionB: { label: 'Decline politely', effects: {} }
    },
    {
        title: 'Equipment Salesman',
        description: 'A salesman offers discounted training equipment, no questions asked.',
        optionA: { label: 'Buy it (-$12,000, +3 team strength)', effects: { finances: -12000, strength: 3 } },
        optionB: { label: 'Too good to be true - decline', effects: {} }
    },
    {
        title: 'Youth Prospect',
        description: 'A promising young trialist has asked for a chance to train with the first team.',
        optionA: { label: 'Give them a trial (-$3,000, +2 team strength)', effects: { finances: -3000, strength: 2 } },
        optionB: { label: 'Not right now', effects: {} }
    },
    {
        title: 'Board Meeting',
        description: "The board wants a word about the club's direction.",
        optionA: { label: 'Reassure them confidently (+5 job security, -2 reputation)', effects: { jobSecurity: 5, reputation: -2 } },
        optionB: { label: 'Be honest about the challenges ahead (+3 reputation)', effects: { reputation: 3 } }
    }
];

/**
 * Apply an event option's effects to the relevant state, clamping where needed.
 * @param {Object} effects
 */
function applyEventEffects(effects) {
    const { clubData, fanData, managerData } = gameState;

    if (effects.finances) clubData.finances += effects.finances;
    if (effects.strength) clubData.strength = Math.max(0, clubData.strength + effects.strength);
    if (effects.fitness) {
        clubData.fitness = Math.max(GAME_CONSTANTS.FITNESS_MIN, Math.min(GAME_CONSTANTS.FITNESS_MAX, clubData.fitness + effects.fitness));
    }
    if (effects.happiness) fanData.happiness = Math.max(0, Math.min(100, fanData.happiness + effects.happiness));
    if (effects.reputation) managerData.reputation = Math.max(0, managerData.reputation + effects.reputation);
    if (effects.jobSecurity) managerData.jobSecurity = Math.max(0, Math.min(100, managerData.jobSecurity + effects.jobSecurity));

    updateUI();
}

/**
 * On the configured cadence, show a random two-choice event and wait for the
 * player's decision before continuing; otherwise continue immediately.
 * @param {Function} callback - Called once the decision (or non-event) is resolved
 */
export function maybeShowRandomEvent(callback) {
    if (gameState.currentMatchday % GAME_CONSTANTS.RANDOM_EVENT_INTERVAL_MATCHDAYS !== 0) {
        callback();
        return;
    }

    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];

    showAnimatedPopup(event.title, event.description, 'info', [
        { text: event.optionA.label, action: () => { applyEventEffects(event.optionA.effects); callback(); } },
        { text: event.optionB.label, action: () => { applyEventEffects(event.optionB.effects); callback(); } }
    ]);
}
