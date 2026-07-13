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

**Status: done.** Verified live in a browser plus 20k-simulation statistical
checks against the actual game code, confirming every probability below
matches its constant exactly.

1. ✅ **Home advantage**: e.g. +8% goal-boost probability for the home side. Now the mirrored
   fixture list matters, and "next match is away at the leaders" becomes a real sentence.
2. ✅ **Visible odds panel**: before choosing a tactic, show a simple strength comparison
   (e.g. "Your strength 62 vs. Ironclad 85 — Underdog"). Dice stay, but the player
   understands what they're modifying.
3. ✅ **Tactics with risk profiles** instead of flat ±1:
   - *All-out attack*: +35% chance of an extra goal, +20% chance of conceding an extra goal.
   - *Park the bus*: 40% chance to cancel one opponent goal, 25% chance of −1 own goal
     (implemented as a misfire penalty rather than a full scoring blackout, to keep it
     from being a guaranteed 0-0 tactic).
   - *Counter-attack*: bonus only when opponent is stronger (underdog tool) — new tactic
     option added to the dropdown.
   - *Balanced*: no modifiers.
   The match result popup and a live ticker narrate the effect ("Your defensive setup
   denied a goal!") so choices feel causal.
4. ✅ **Team fitness as a season-long resource**: `clubData.fitness` carries over from
   pre-season, drains ~4 points/matchday, and scales effective match strength by up to
   ~20%. Training level reduces the drain rate (rather than an active "restore" action)
   — a lighter-weight version of "training restores it" that still gives the training
   upgrade a second purpose. Displayed in the Club tab.
5. ✅ **Match events feed** (ticker + result-popup narrative): 7 flavour events
   ("Red card!", "Penalty saved!", wondergoals, etc.), 25% chance per player match of
   nudging the scoreline by one goal.

### Phase 2 — Stakes and consequences

**Status: all 5 items are done.** Item 4 (Champions Cup) shipped as its own follow-up
PR given its size (tournament bracket state, cross-league seeding, a new season-end
flow). Verified live: board expectations computed/displayed for weak and strong teams,
sacking → job board → accept-offer flow with correct career-vs-club state reset,
reputation-gated offers, bankruptcy warning-then-forced-sale sequence, lifestyle
upkeep billing, and the full Champions Cup bracket (qualification, rounds, elimination
at multiple stages, a forced win, and the non-qualifying regression path) — all with
exact expected numbers.

1. ✅ **Board expectations & sacking**: at season/job start the board sets a target
   based on squad strength rank (with one position of slack). Job security drifts every
   matchday toward or away from that target, independent of match results; at 0 → sacked
   → full-screen sequence (using the `lose cover.png` asset) → job board. Rather than a
   true "game over", sacking feeds directly into item 3 below so the career continues.
2. ✅ **Bankruptcy pressure**: a matchday with negative finances draws a board warning;
   two consecutive negative matchdays trigger a forced asset sale (strength penalty +
   cash bailout) and a job security hit.
3. ✅ **Manager career mode**: reputation gates job offers on a new Job Board shown after
   a sacking — modest/mid/strong clubs across all 8 leagues, stronger clubs requiring
   higher reputation. The single weakest offer is always free of a requirement so a
   career can never fully dead-end. Accepting resets club-specific state (finances,
   strength, stadium, upgrades, fitness) while wealth/reputation/lifestyle persist.
4. ✅ **Continental qualification**: finish top 2 → enter the **Champions Cup**, a
   16-team single-elimination knockout drawn from all 8 leagues (the player's actual
   top 2 plus 2 strength-weighted qualifiers from each other league, since those
   leagues aren't simulated week-to-week). Draws go to a penalty shootout rather than
   a second leg. Rewards scale from a small participation bonus up to $300,000 + 20
   reputation for winning it all. Wired into the previously-unused
   `#champions-cup-view`/`#champions-cup-groups` scaffolding. (Promotion/relegation
   itself was not pursued — qualification was the cheaper, higher-value option as
   originally noted.)
5. ✅ **Recurring lifestyle costs**: lifestyle items now bill their monthly cost from
   personal wealth every 4 matchdays, instead of a one-time purchase with a cosmetic
   "$X/month" label that was never charged.

### Phase 3 — Depth and retention

**Status: all 5 items are done.** Verified live: random events firing on the exact
3-matchday cadence, all 8 newspaper headline-selection branches, a rigged 4-season
career correctly unlocking all four testable achievements with the trophy cabinet/
history table rendering correctly, and the squad/transfer system (buy/sell financial
and strength deltas, forced injury/suspension/academy RNG paths, and a multi-matchday
run with live status updates) with no console errors.

1. ✅ **Lightweight squad**: not full player management — a squad of 5 named "key
   players" (GK, DF, MF, FW, Star) each with a rating that sums to club strength.
   - Transfer market: buy/sell key players with `transferBudget` (finally used), with
     6 fresh listings generated each season and priced off rating.
   - Injuries/suspensions: a small per-matchday chance rules a player out, temporarily
     reducing effective match strength until they recover a few matchdays later.
   - Youth academy payoff: each season the academy level rolls a chance to produce a
     free young key player who replaces the squad's weakest member.
2. ✅ **Season history & trophy cabinet**: every completed season is recorded (league,
   position, league champion, Champions Cup result). Rather than fabricating standings
   for the 7 leagues never simulated week-to-week, "past winners" is the player's own
   accurate season-by-season record — trophy counts, achievements, and full history —
   replacing the dead `populateChampionsView()` placeholder in the World > Past
   Champions tab.
3. ✅ **Dynamic newspaper**: `showNewsModal` now picks from context-aware headline pools
   (landmark win/loss margins, title race, losing streak, board pressure, relegation
   zone) using league position and recent form, instead of one fixed message per
   win/draw/loss.
4. ✅ **Random events between matchdays**: every 3rd matchday, a two-choice decision
   (sponsor deals, player unrest, weather, fan protests, etc.) trades club/personal
   finances against fan happiness, reputation, job security, strength, or fitness.
5. ✅ **Achievements**: Invincible (unbeaten season), Worst to First, Continental
   Champion (win the Champions Cup), Dynasty (5 combined trophies), and Tycoon ($5M
   finances) — unlocked automatically and persisted alongside save data.

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
