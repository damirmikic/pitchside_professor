# Pitchside Professor — Code Review & Gameplay Improvement Plan

This document contains (1) a code review of the current codebase with concrete bugs found,
(2) a gameplay/design review, and (3) a phased plan of improvements and new features.

---

## Part 1 — Code Review: Bugs That Break the Game Today

These should be fixed before any new features. Several of them mean core systems
silently do nothing.

### 1.1 CRITICAL: Escaped template literals render as literal text (90 occurrences)

Every manager module contains `\${...}` inside template literals. In JavaScript,
`\$` escapes the dollar sign, so **no interpolation happens** — the UI literally
displays `${team.name}`, `${fixture.home}`, etc.

- Affected files (occurrence counts): `match-manager.js` (26), `finance-manager.js` (22),
  `preseason-manager.js` (15), `club-manager.js` (13), `season-manager.js` (6),
  `fan-manager.js` (5), `lifestyle-manager.js` (3).
- Examples: `src/js/managers/match-manager.js:59-70` (entire league table),
  `src/js/managers/match-manager.js:424` (match result message),
  `src/js/managers/finance-manager.js:152-179` (sponsorship offer cards).

**Fix:** global replace of `\${` → `${` in the seven manager modules.

### 1.2 CRITICAL: Club strength upgrades have no effect on matches

`simulateMatch()` (`src/js/managers/match-manager.js:315-329`) reads
`team.strength` from `leagueTable`, which is initialized from `baseStrength`
(values 4–10, see `initializeLeagueTable()` at `match-manager.js:17-28`). Meanwhile:

- The player's real strength lives in `gameState.clubData.strength` (initialized to
  `baseStrength * 10` in `main.js:108`, boosted by training upgrades and pre-season).
- The strength bonus is `Math.floor(strength / 20)` — for league-table values of 4–10
  this is **always 0**, so team strength (and every upgrade the player buys) has
  **zero effect on match results**. Matches are pure dice.

**Fix:** unify the strength scale (0–100), sync the player's row in `leagueTable`
with `clubData.strength`, and make the modifier meaningful (see Part 3, Phase 1).

### 1.3 CRITICAL: Pre-season only ever happens once

`startNewSeason()` (`src/js/managers/season-manager.js:41-73`) increments the season
and regenerates fixtures but never resets `preSeasonData` or re-enters pre-season.
Fitness/chemistry, friendlies, and the season-ticket sales drive exist only in Season 1.

### 1.4 Weekly wages are almost never paid (broken economy)

`processWeeklyWages()` (`src/js/managers/finance-manager.js:213-230`) compares
**real-world wall-clock time** (`Date.now()`, 7 days in ms) instead of game time.
Unless a player leaves the browser open for a week, wages are never deducted —
the club only ever gains money, so financial decisions carry no tension.

**Fix:** charge wages per matchday (each matchday ≈ 1 game week).

### 1.5 "5% per season" takeover fires 5% per matchday

`triggerFinancialTakeover()` is called from `playMatchday()`
(`match-manager.js:211`) with a 5% roll each call (`finance-manager.js:295`).
Over a 14-matchday season that's a ~51% chance of a $500k–$1.5M windfall per
season — it dwarfs all other revenue and trivializes the economy.

### 1.6 Concessions/store upgrades pay the manager personally, forever

`upgradeConcessions()` and `upgradeStore()` (`src/js/managers/club-manager.js:118-161`)
add $25,000 / $15,000 to `managerData.wealth` (the manager's personal money, not the
club's) and can be purchased repeatedly with no level tracking — an infinite
club-money → personal-wealth converter.

**Fix:** track `concessionsLevel` / `storeLevel`, scale costs, and have the levels
increase **club matchday revenue** (concessions revenue in
`calculateMatchdayRevenue()` is currently hardcoded `attendance * 5`,
`finance-manager.js:240`).

### 1.7 `showNotification()` is called with the wrong signature everywhere

The function takes `(message, type)` (`src/js/ui/notification-system.js:117`), but
most call sites pass `(title, message, type)` — e.g. `finance-manager.js:227`,
`fan-manager.js:52`, `preseason-manager.js:110`, `lifestyle-manager.js:39`. The
"type" argument lands in the CSS class slot, so toasts show only the title and lose
their success/warning/error styling.

### 1.8 Second half of the season is not mirrored (no true home & away)

`generateFixtures()` (`match-manager.js:82-112`) rotates for `(n-1)*2` rounds, but a
round-robin rotation cycles after `n-1` rounds — matchdays 8–14 duplicate matchdays
1–7 with **identical home/away assignments**. Also, there is no home advantage in the
simulation at all, so "home" is cosmetic.

### 1.9 Tab switching from game code silently fails

`preseason-manager.js:27` and `:333` do `if (typeof openTab === 'function')`, but
`openTab` is not imported in that module scope, so the branch never runs (the
module-scope identifier is undefined; only `window.openTab` exists). Also
`openTab(null, ...)` would crash on `evt.currentTarget` (`ui-controller.js:254`).

### 1.10 Smaller issues / dead code

- Duplicate dice logic: `rollWeightedDice`/`animateDiceRoll`/`updateDiceDisplay` exist in
  both `match-manager.js` and `utils/dice.js` (the util version with `GAME_CONSTANTS.DICE_WEIGHTS`
  is unused by the match engine).
- `scheduleFriendlyMatch()` (`preseason-manager.js:129-138`) inlines a full copy of the
  leagues data instead of importing `data/leagues.js`.
- `getTacticBonus()` (`match-manager.js:397`) is dead code and returns 0 for defensive.
- Newspaper overlay uses root-relative `manager newspaper.png` (`match-manager.js:478`)
  instead of the optimized `src/assets/images/manager newspaper.webp`.
- Lifestyle items advertise "$X/month" (`lifestyle-manager.js:117`) but no recurring
  cost is ever charged.
- Season-ticket revenue is double-counted in Season 1: `calculateSeasonTicketSales()`
  adds the full sale to finances at init, then `advancePreSeasonDay()` sells and
  charges daily on top (`preseason-manager.js:295-301`), ignoring price/happiness.
- Duplicate `updateSeasonTicketDisplay()` in `finance-manager.js` and `ui-controller.js`.
- Hardcoded costs in `club-manager.js`/`fan-manager.js` duplicate values already
  defined in `data/constants.js` (single source of truth is not used).
- `index.html.backup` and duplicate root-level PNGs inflate the repo; the
  `src/assets/images` copies are the ones referenced by the game.
- `saveToLocalStorage` never persists `saveMetadata`'s `financialHistory` weekly
  expense `Date` objects safely (they serialize to strings and are never re-hydrated).

---

## Part 2 — Gameplay Design Review

The core loop is: *pick tactic → roll dice → collect revenue → buy upgrades → repeat*.
Right now the loop has **no failure states, no meaningful choices, and no persistent
consequences**:

| Problem | Why it hurts |
|---|---|
| No game over | Job security drops on losses but nothing happens at 0. Finances can go negative with no consequence. There is no way to lose, so there are no stakes. |
| Upgrades don't matter | Because of bug 1.2, training/strength never influence results. Players discover money doesn't buy anything real. |
| Tactics are a strict trade with no context | Attacking +1 own goals, Defensive −1 opponent goals — mathematically symmetric, no rock-paper-scissors vs. opponent, no risk. There's a dominant "always defensive vs strong teams" pattern the moment strength matters. |
| Money only goes up | With wages broken (1.4) and takeovers frequent (1.5), the economy is a score counter, not a resource to manage. |
| Nothing carries between seasons | No pre-season (1.3), no promotion/relegation, no history, no trophy cabinet. Season 2 is Season 1 again. |
| The manager is not a character | Wealth/reputation/lifestyle exist but feed nothing: reputation only sets an unused `transferBudget`; lifestyle is a one-time reputation buy. |
| Dice are invisible strategy | The dice theme is charming, but the player never sees how strength/tactics changed the odds — outcomes feel arbitrary. |

---

## Part 3 — Phased Improvement Plan

### Phase 0 — Repair (fix what exists) — *highest priority, ~1 short PR each*

**Status: items 1-8 and most of 9 are done** (see commit history on this branch).
Verified end-to-end in a real browser: pre-season → matchday → full season
transition into season 2's pre-season, wages deducting, upgrades affecting
finances/strength, mirrored fixtures, no literal `${...}` anywhere in the UI.
Still open from item 9: deleting `index.html.backup` and the duplicate
root-level images. Also fixed one bug found during verification that wasn't
in the original list: the sidebar season/matchday counters only refreshed on
sidebar nav clicks, so they went stale across a season transition.

1. ✅ **Fix all 90 `\${` escapes** (bug 1.1). This alone makes the game presentable.
2. ✅ **Wire strength into the match engine** (bug 1.2): keep one 0–100 scale,
   sync the player's league-table row from `clubData.strength` before each matchday.
3. ✅ **Game-time wages**: deduct `weeklyWages` every matchday; remove `Date.now()` logic.
4. ✅ **Takeover**: roll once per season end (5%), or make it a rare mid-season event at ~0.3%/matchday.
5. ✅ **Concessions/store levels** that raise club matchday revenue instead of paying the manager.
6. ✅ **Fix `showNotification` call sites** (or accept `(title, message, type)` and render a title).
7. ✅ **Mirror fixtures**: generate `n-1` rounds, then append the reversed-venue mirror.
8. ✅ **Restore pre-season every season** in `startNewSeason()` (reset `preSeasonData`, re-enter pre-season flow).
9. ⬜ Cleanup: dedupe dice utils ✅, import `leagues` in `preseason-manager` ✅, use
   `GAME_CONSTANTS` for all costs ✅, delete `index.html.backup` + duplicate root images (not done).

### Phase 1 — Make matches a game, not a coin flip

1. **Home advantage**: e.g. +8% goal-boost probability for the home side. Now the mirrored
   fixture list matters, and "next match is away at the leaders" becomes a real sentence.
2. **Visible odds panel**: before choosing a tactic, show a simple strength comparison
   (e.g. "Your strength 62 vs. Ironclad 85 — Underdog"). Dice stay, but the player
   understands what they're modifying.
3. **Tactics with risk profiles** instead of flat ±1:
   - *All-out attack*: +35% chance of an extra goal, +20% chance of conceding an extra goal.
   - *Park the bus*: 40% chance to cancel one opponent goal, −25% chance of scoring at all.
   - *Counter-attack*: bonus only when opponent is stronger (underdog tool).
   - *Balanced*: no modifiers.
   Show the effect in the match result ("Your defensive setup denied a goal!") so choices feel causal.
4. **Team fitness/morale as a season-long resource**: carry pre-season fitness into the
   season; each match drains it slightly, training restores it, low fitness = strength
   penalty. Creates a rest/rotate rhythm and gives training camps a purpose.
5. **Match events feed** (text ticker between dice roll and result): 3–5 flavour events
   ("Red card!", "Penalty saved!") that occasionally modify the roll. Cheap to build,
   large perceived depth.

### Phase 2 — Stakes and consequences

1. **Board expectations & sacking (game over)**: at season start the board sets a target
   based on squad strength rank (e.g. "finish top 4"). Job security drifts toward
   performance vs. expectation; at 0 → sacked → game-over screen (uses the existing
   `lose cover.png` asset) with career summary and "Start new career".
2. **Bankruptcy pressure**: if finances go negative, the board issues a warning; two
   consecutive negative months = forced asset sale (strength penalty) and job security hit.
3. **Manager career mode**: reputation gates job offers. After a sacking (or a trophy),
   receive offers from other clubs/leagues — stronger clubs demand higher reputation.
   This turns the 8 themed leagues × 64 teams into a career ladder instead of a menu.
4. **Promotion/relegation OR continental qualification**: with 8 self-contained leagues,
   the cheapest high-value option is qualification: finish top 2 → enter next season's
   **Champions Cup** (knockout bracket seeded with top teams from all 8 leagues —
   the `champions cup throphy.png` asset already exists for this). Extra fixtures,
   extra revenue, extra reputation.
5. **Recurring lifestyle costs**: lifestyle items charge their monthly cost every 4
   matchdays and grant an ongoing small job-security/reputation buffer — making
   personal wealth a real budget instead of a one-way score.

### Phase 3 — Depth and retention

1. **Lightweight squad**: not full player management — a squad of ~5 named "key players"
   (GK, DF, MF, FW, star) each with a rating that sums to club strength. Enables:
   - Transfer market: buy/sell key players with `transferBudget` (finally used).
   - Injuries/suspensions from match events (temporary strength loss, forces decisions).
   - Youth academy payoff: each season the academy level rolls a chance to produce a
     free young key player.
2. **Season history & trophy cabinet**: persist final tables per season; populate the
   currently-empty Champions/World tab (`main.js:331-336`) with past winners, career
   honours, and the trophy images.
3. **Dynamic newspaper**: the newspaper modal is a great asset — vary headlines using
   league context (title race, derby, losing streak, board pressure) instead of the
   current three static texts (`match-manager.js:528-537`).
4. **Random events between matchdays**: one small decision every few matchdays
   (sponsor scandal, star player interview, weather, fan protest) with two choices
   trading money vs. happiness vs. security. Cheap content, big variety.
5. **Achievements**: invincible season, worst-to-first, 5 trophies, tycoon (>$5M), etc.
   Stored in localStorage alongside saves (save infrastructure already exists and is good).

### Phase 4 — Technical foundation (parallel track)

1. Unit tests (Vitest) for the pure logic: fixture generation (mirroring!), match
   engine distribution, finance math — the Phase 0 bugs above would all have been
   caught by ~10 tests.
2. A tiny build step (Vite) to bundle modules, hash assets, and enable dev server.
3. Extract remaining inline `onclick` handlers from `index.html` so `window.*`
   exports in `main.js:339-347` can be removed.
4. Central event/turn pipeline: `playMatchday()` currently hand-sequences revenue,
   wages, events, saves, and UI updates; a simple ordered list of "turn phases" will
   keep Phases 1–3 from turning it back into spaghetti.

---

## Part 4 — Suggested Balancing Baseline (after wages are fixed)

| Lever | Suggested value | Rationale |
|---|---|---|
| Weekly wages | $15,000/matchday, +5%/season | Base attendance revenue ≈ $15–25k/match keeps net income slim early game |
| Matchday revenue | attendance × ticket price + attendance × ($3 + concessionsLevel) | Ties concession upgrades to revenue |
| Strength modifier | ±1 goal chance = (yourStrength − theirStrength) × 0.6% per point | Strength 90 vs 40 ≈ 30% swing — noticeable, not deterministic |
| Home advantage | +8% extra-goal chance | Enough to feel, not dominate |
| Takeover event | 5% once per season end | Restores original intent |
| TV money | $50k + position-scaled (existing formula is fine) | — |
| Board target | strength rank ±1 | Overachieving builds security cushion |

---

## Recommended execution order

1. **PR 1 (Repair)**: Phase 0 items 1–9 — the game starts working as designed.
2. **PR 2 (Matches)**: Phase 1 items 1–3 — matches become decisions.
3. **PR 3 (Stakes)**: Phase 2 items 1–2 — the game can be lost.
4. Then alternate one feature PR (Phases 2–3) with one technical PR (Phase 4),
   starting with tests for whatever was just built.
