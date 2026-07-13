# Pitchside Professor ⚽

A football/soccer management simulation game built with vanilla JavaScript.

## 🎮 Features

- **8 Unique Leagues**: Choose from diverse themed leagues
- **Club Management**: Manage finances, stadium, and facilities
- **Match Simulation**: Dice-based match outcomes with tactical choices
- **Squad & Transfer Market**: Sign and sell key players, weather injuries and
  suspensions, and benefit from youth academy graduates
- **Champions Cup**: Qualify and compete in a continental knockout competition
- **Fan Engagement**: Manage ticket prices and fan happiness
- **Manager Career**: Build wealth, reputation, and job security, including
  being sacked and rehired via the job board
- **Season History & Achievements**: A trophy cabinet and unlockable
  achievements (Invincible, Worst to First, Continental Champion, Dynasty,
  Tycoon) tracked across your career
- **Dynamic Newspaper & Random Events**: Context-aware headlines and
  between-matchday decisions that affect finances, reputation, and squad
- **Pre-Season System**: Prepare your team before the season starts
- **Sponsorship Deals**: Negotiate and accept sponsorship offers
- **Lifestyle Management**: Purchase homes, cars, and entertainment with
  recurring upkeep costs
- **Season Progression**: Multi-season career mode

## 🚀 Getting Started

### Running Locally

1. Clone the repository
2. Open `intro.html` in a modern web browser
3. Select your league and team
4. Start managing!

**Note**: Due to ES6 modules, you may need to serve the files through a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Then navigate to http://localhost:8000/intro.html
```

### Browser Requirements

- Chrome 61+ / Edge 16+
- Firefox 60+
- Safari 10.1+
- Modern mobile browsers

## 📁 Project Structure

```
Pitchside Professor/
├── index.html              # Main game page
├── intro.html              # Team selection page
├── intro-video.html        # Introduction video
├── REFACTORING.md          # Detailed refactoring documentation
│
└── src/
    ├── css/
    │   └── styles.css      # Game styles
    │
    ├── assets/images/      # Game images and graphics
    │
    └── js/
        ├── main.js         # Application entry point
        ├── core/           # Core game engine
        ├── data/           # Game data and constants
        ├── managers/       # Game logic modules
        ├── ui/             # UI controllers
        └── utils/          # Utility functions
```

## 🏗️ Architecture

The game uses a **modular ES6 architecture** with clear separation of concerns:

- **Core**: State management and game engine
- **Data**: Leagues, teams, and constants
- **Managers**: Business logic (matches, finance, clubs, fans, seasons, squad
  and transfers, the Champions Cup, career history, random events)
- **UI**: User interface controllers and notifications
- **Utils**: Reusable utility functions

See [REFACTORING.md](REFACTORING.md) for detailed architecture documentation.

## 🔧 Development

### Adding New Features

1. **New Manager Module**: Create in `src/js/managers/`
2. **New Data**: Add to `src/js/data/`
3. **New UI Component**: Create in `src/js/ui/`
4. **New Utility**: Add to `src/js/utils/`

### Module Structure

```javascript
// Import dependencies
import { gameState } from '../core/state-manager.js';
import { showSuccessPopup } from '../ui/notification-system.js';

// Define and export functions
export function myFeature() {
    // Implementation
}
```

### State Access

```javascript
import { gameState } from './core/state-manager.js';

// Access game state
gameState.managerData.wealth += 1000;
gameState.clubData.finances -= 500;
```

## 📊 Code Statistics

- **27 JavaScript modules** (previously 1 monolithic file)
- **~7,200 lines** of modular JavaScript
- **12 manager modules** covering matches, finance, clubs, fans, seasons,
  squad/transfers, the Champions Cup, career history, and random events

## 🎯 Game Concepts

### Match Simulation
- Weighted dice rolls (0-5 goals)
- Tactical bonuses (Attacking/Defensive/Balanced)
- Team strength modifiers, including squad fitness and unavailable (injured/
  suspended) key players

### Squad & Transfer Market
- A 5-player key squad (GK, DF, MF, FW, Star) whose ratings sum to club
  strength
- Buy and sell players on a transfer market that refreshes each season
- Injuries and suspensions temporarily weaken the squad until players recover
- Youth academy upgrades give a level-scaled chance of a free prospect each
  season

### Financial System
- Season ticket revenue
- Matchday ticket sales
- TV revenue based on position
- Sponsorship deals
- Weekly wage payments
- Recurring lifestyle upkeep costs

### Club Development
- Training facility upgrades
- Youth academy upgrades
- Stadium expansion
- Concession upgrades
- Merchandise store upgrades

### Manager Progression
- Personal wealth accumulation
- Reputation building
- Job security management, including sacking and rehiring via the job board
- Lifestyle purchases
- Season-by-season history, trophy cabinet, and unlockable achievements

## 🐛 Troubleshooting

### Module Loading Errors

If you see module loading errors:
1. Ensure you're using a local server (not file://)
2. Check browser console for specific errors
3. Verify all paths are correct

### Save Data

Game uses localStorage to store the full game state (club, manager, squad,
transfer listings, league table, season history, and achievements), plus the
selected league and team from `intro.html`.

To reset: Clear browser localStorage or select a new team via intro.html

## 📝 License

This is a personal project. Feel free to learn from the code structure and architecture.

## 🎨 Credits

- **Pico CSS**: UI framework
- **Canvas Confetti**: Celebration animations

## 📚 Documentation

- [REFACTORING.md](REFACTORING.md) - Complete refactoring documentation
- Inline JSDoc comments in all modules

## 🔮 Future Enhancements

- TypeScript migration
- Unit testing with Jest/Vitest
- Build system (Webpack/Vite)
- Deeper player management (full squads, individual player attributes/growth)
- Advanced statistics

See [GAMEPLAY_IMPROVEMENT_PLAN.md](../GAMEPLAY_IMPROVEMENT_PLAN.md) for the
full, up-to-date roadmap and status of each phase.

---

**Enjoy managing your team to glory! ⚽🏆**
