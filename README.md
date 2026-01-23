# ⚽ Pitchside Professor

A browser-based football/soccer management simulation game where you build your legacy from the ground up!

![Game Status](https://img.shields.io/badge/status-alpha-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-web-green)

## 🎮 About

**Pitchside Professor** is an immersive football management game featuring:
- **Unique Dice-Rolling Match Engine** - Tactical decisions matter!
- **8 Fantasy Leagues** - From Celestial Super League to Mythical Monsters League
- **64 Unique Teams** - Each with distinct strengths and characteristics
- **Comprehensive Management** - Handle finances, facilities, fans, and more
- **Dynamic Career Mode** - Build your reputation from a small club to legendary status

## ✨ Features

### Current Features
- 🎲 **Dice-Based Match Simulation** - Weighted dice rolls with tactical modifiers
- 🏆 **8 Fantasy-Themed Leagues** - Unique leagues with creative team names
- 💰 **Financial Management** - Club finances, sponsorships, season tickets
- 🏟️ **Stadium Development** - Expand capacity and improve facilities
- 👥 **Fan Management** - Ticket pricing, promotions, fan happiness
- 🏃 **Pre-Season System** - Friendly matches, training camps, team preparation
- 🏠 **Lifestyle Management** - Manager housing, cars, entertainment
- 📺 **Media Relations** - Press conferences and promotional activities
- 📊 **League Tables** - Real-time standings with proper sorting
- 📅 **Fixture System** - Full season scheduling
- 💾 **Save System** - LocalStorage-based game saves

### League Themes
1. **Celestial Super League** - Space-themed teams (Quantum Rovers, Nebula Nomads)
2. **Clockwork Championship** - Steampunk teams (Ironclad Internazionale, Cogsworth City)
3. **Gilded Gauntlet** - Wealth-themed teams (Eldorado Empire, Argentum Assembly)
4. **Jade Empire Division** - Asian-inspired teams (Dragonstone Dynamos, Emerald Pagodas)
5. **Voodoo Premier League** - Mystical teams (Bayou Phantoms, Spirit Strikers)
6. **Neon Nights League** - Cyberpunk teams (Cyber Samurai, Digital Dragons)
7. **Elemental Championship** - Nature-themed teams (Inferno Titans, Tsunami Tempest)
8. **Mythical Monsters League** - Creature-based teams (Dragon Slayers, Phoenix Rising)

## 🚀 Getting Started

### Play Now (No Installation)

1. Clone the repository:
```bash
git clone https://github.com/damirmikic/pitchside_professor.git
cd pitchside_professor
```

2. Open `Pitchside Professor/intro.html` in your browser

3. Select your league and team

4. Start your management career!

### For Development

```bash
# Install dependencies (once build system is added)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 🎯 How to Play

1. **Team Selection** - Choose from 8 unique leagues and pick your team
2. **Pre-Season** - Prepare your team with friendlies and training
3. **Match Day** - Select tactics (Balanced, Attacking, Defensive) and play matches
4. **Management** - Handle finances, upgrade facilities, manage fans
5. **Season Progression** - Complete 14 matchdays to finish the season
6. **Build Your Legacy** - Improve reputation, wealth, and club strength

### Game Systems

**Match Simulation:**
- Dice roll system (0-5 weighted toward 0)
- Tactical choices affect outcomes
- Team strength modifiers

**Financial Management:**
- Starting budget: $100,000
- Weekly wages: $15,000
- Revenue sources: Matchday, season tickets, sponsorships, TV rights

**Career Progression:**
- Manager reputation (0-100)
- Job security percentage
- Personal wealth accumulation
- Club strength improvement

## 📁 Project Structure

```
pitchside_professor/
├── Pitchside Professor/
│   ├── index.html          # Main game (2,411 lines)
│   ├── intro.html          # Team selection screen
│   ├── intro-video.html    # Video introduction
│   ├── styles.css          # Game styling (2,294 lines)
│   └── images/             # Game assets (PNG files)
│       ├── cover manager.png
│       ├── stadium-*.png
│       └── trophy images
├── README.md
├── ANALYSIS_AND_RECOMMENDATIONS.md
└── .git/
```

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid, Flexbox, animations
- **Vanilla JavaScript** - No framework dependencies
- **Pico CSS** - Minimal CSS framework
- **Canvas Confetti** - Celebration effects
- **LocalStorage API** - Game save persistence

## 🐛 Known Issues

See [ANALYSIS_AND_RECOMMENDATIONS.md](./ANALYSIS_AND_RECOMMENDATIONS.md) for detailed analysis.

**Major Issues:**
- Monolithic architecture (all code in single file)
- No build process or testing
- Large unoptimized images (~37MB)
- Limited mobile optimization
- No backend/cloud saves

## 🚧 Roadmap

### Phase 1: Foundation (Priority)
- [ ] Modularize codebase into separate JS files
- [ ] Add build system (Vite)
- [ ] Optimize images to WebP
- [ ] Create comprehensive documentation
- [ ] Add .gitignore and package.json

### Phase 2: Quality
- [ ] Add Jest testing framework
- [ ] Implement ESLint + Prettier
- [ ] Add JSDoc documentation
- [ ] Fix identified bugs
- [ ] Improve accessibility (ARIA, keyboard nav)

### Phase 3: New Features
- [ ] Individual player management system
- [ ] Enhanced match engine with detailed events
- [ ] Statistics and analytics dashboard
- [ ] Achievement system
- [ ] Multiple save game slots
- [ ] Youth academy and scouting

### Phase 4: Polish
- [ ] Advanced animations and transitions
- [ ] Sound effects and background music
- [ ] Tutorial system for new players
- [ ] Progressive Web App (PWA)
- [ ] Mobile-first redesign

### Phase 5: Multiplayer
- [ ] Backend integration (Firebase/Supabase)
- [ ] User authentication
- [ ] Online leagues
- [ ] Leaderboards
- [ ] Cloud saves

## 🤝 Contributing

Contributions are welcome! This is an early-stage project with lots of opportunities for improvement.

**Ways to contribute:**
1. Report bugs via GitHub Issues
2. Suggest new features
3. Improve documentation
4. Submit pull requests for bug fixes
5. Help with code refactoring
6. Create artwork or sound assets

**Before contributing:**
- Read [ANALYSIS_AND_RECOMMENDATIONS.md](./ANALYSIS_AND_RECOMMENDATIONS.md)
- Check existing issues and PRs
- Follow code style guidelines (to be established)

## 📝 Development Notes

**Current State:**
- Alpha version
- Single-player only
- Browser-based (Chrome, Firefox, Safari, Edge)
- No server required
- Save games stored locally

**Performance:**
- Works best on modern browsers (2020+)
- Requires JavaScript enabled
- ~40MB total (mostly images)
- No heavy CPU usage

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

**Damir Mikic**
- GitHub: [@damirmikic](https://github.com/damirmikic)

## 🙏 Acknowledgments

- Pico CSS for the base styling framework
- Canvas Confetti for celebration effects
- The football management game community for inspiration

## 📊 Statistics

- **Lines of Code:** ~4,700 (HTML, CSS, JS combined)
- **Game Systems:** 13 major features
- **Teams Available:** 64 across 8 leagues
- **Development Time:** Early stage
- **Target Platform:** Modern web browsers

## 🎮 Screenshots

*(Screenshots to be added)*

## 📞 Support

Having issues? Found a bug?
- Open a GitHub Issue
- Check existing documentation
- Review the analysis document

## 🔗 Links

- [Detailed Analysis & Recommendations](./ANALYSIS_AND_RECOMMENDATIONS.md)
- [GitHub Repository](https://github.com/damirmikic/pitchside_professor)
- [Live Demo](https://damirmikic.github.io/pitchside_professor) *(to be deployed)*

---

**Made with ⚽ and 💻**

*Build your legacy. Manage your destiny.*
