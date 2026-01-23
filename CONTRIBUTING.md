# Contributing to Pitchside Professor

Thank you for your interest in contributing to Pitchside Professor! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

Be respectful, constructive, and collaborative. We're all here to make a great game!

## 🎯 How Can I Contribute?

### 1. Reporting Bugs

Before creating bug reports:
- Check the issue tracker to avoid duplicates
- Collect information about the bug (browser, OS, steps to reproduce)

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - Browser: [e.g. Chrome 120]
 - OS: [e.g. Windows 11]
 - Game Version: [e.g. 0.1.0]

**Additional context**
Any other relevant information.
```

### 2. Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature has already been suggested
- Provide clear use cases
- Explain how it fits with the game's vision
- Consider implementation complexity

**Feature Request Template:**
```markdown
**Feature Description**
Clear description of the feature.

**Problem it solves**
What problem does this feature address?

**Proposed Solution**
How would this feature work?

**Alternative Solutions**
Any alternative approaches considered?

**Additional context**
Mockups, examples, or references.
```

### 3. Contributing Code

#### Getting Started

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR-USERNAME/pitchside_professor.git
cd pitchside_professor
```

3. Create a branch:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

4. Make your changes

5. Test your changes thoroughly

6. Commit with clear messages:
```bash
git commit -m "Add player morale system"
git commit -m "Fix league table sorting bug"
```

7. Push to your fork:
```bash
git push origin feature/your-feature-name
```

8. Create a Pull Request

#### Pull Request Guidelines

**PR Title Format:**
- `feat: Add player management system`
- `fix: Correct dice roll probability`
- `docs: Update README with new features`
- `refactor: Split monolithic game.js into modules`
- `style: Format code with Prettier`
- `test: Add match simulation tests`
- `chore: Update dependencies`

**PR Description Should Include:**
- What changes were made
- Why the changes were necessary
- How to test the changes
- Any breaking changes
- Screenshots (if UI changes)

**Before Submitting:**
- [ ] Code follows existing style
- [ ] Comments added for complex logic
- [ ] Tests added/updated (when testing is available)
- [ ] Documentation updated if needed
- [ ] No console.log() statements left in code
- [ ] Tested in multiple browsers
- [ ] No new warnings in console

## 📝 Code Style Guidelines

### JavaScript

```javascript
// Use camelCase for variables and functions
const playerName = 'John Doe';
function calculateTeamStrength() { }

// Use PascalCase for classes
class MatchEngine { }

// Use UPPER_CASE for constants
const MAX_TEAM_STRENGTH = 100;

// Prefer const over let, never use var
const config = { };
let counter = 0;

// Use template literals for string interpolation
const message = `Player ${playerName} scored!`;

// Use arrow functions for callbacks
teams.forEach(team => processTeam(team));

// Add JSDoc comments for functions
/**
 * Simulates a match between two teams
 * @param {Object} homeTeam - Home team data
 * @param {Object} awayTeam - Away team data
 * @returns {Object} Match result
 */
function simulateMatch(homeTeam, awayTeam) { }

// Use early returns to reduce nesting
function validatePlayer(player) {
  if (!player) return false;
  if (!player.name) return false;
  return true;
}

// Prefer descriptive names over comments
// Bad:
const x = 5; // reputation bonus

// Good:
const reputationBonus = 5;
```

### HTML

```html
<!-- Use semantic HTML5 elements -->
<section id="league-view">
  <header>
    <h2>League Table</h2>
  </header>
  <article>
    <!-- Content -->
  </article>
</section>

<!-- Add ARIA labels for accessibility -->
<button aria-label="Play next match" onclick="playMatch()">
  Play Match
</button>

<!-- Use data attributes for custom data -->
<div class="team-card" data-team-id="5" data-strength="8">
  <!-- Content -->
</div>
```

### CSS

```css
/* Use BEM naming convention */
.team-card { }
.team-card__header { }
.team-card__title { }
.team-card--highlighted { }

/* Group related properties */
.element {
  /* Positioning */
  position: relative;
  top: 0;
  left: 0;

  /* Display & Box Model */
  display: flex;
  width: 100%;
  padding: 1rem;
  margin: 0;

  /* Typography */
  font-size: 1rem;
  line-height: 1.5;

  /* Visual */
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;

  /* Misc */
  cursor: pointer;
}

/* Use CSS custom properties for theming */
:root {
  --color-primary: #2d5a27;
  --spacing-md: 1rem;
}

/* Mobile-first responsive design */
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    width: 750px;
  }
}
```

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, test:
- [ ] All features work as expected
- [ ] No console errors
- [ ] Mobile responsiveness (if UI changes)
- [ ] Different browsers (Chrome, Firefox, Safari)
- [ ] Save/load game functionality
- [ ] Performance (no lag or freezing)

### Automated Testing (Future)

Once testing infrastructure is added:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 Project-Specific Guidelines

### Game Balance

When adding/modifying game mechanics:
- Consider balance and fairness
- Avoid making the game too easy or too hard
- Test with different scenarios
- Document the reasoning behind balance changes

### Performance

- Avoid excessive DOM manipulations
- Use event delegation where possible
- Lazy load images
- Minimize reflows and repaints
- Profile code with browser dev tools

### User Experience

- Provide clear feedback for user actions
- Add loading states for async operations
- Include error messages that are helpful
- Ensure keyboard navigation works
- Test accessibility features

### Data Structures

Current game state structure:
```javascript
const gameState = {
  season: 1,
  matchday: 1,
  playerTeam: { /* team data */ },
  leagueTable: [ /* teams */ ],
  fixtures: [ /* matches */ ],
  managerData: {
    wealth: 50000,
    reputation: 50,
    jobSecurity: 75,
    lifestyle: []
  },
  clubData: {
    finances: 100000,
    strength: 50,
    stadiumCapacity: 1000,
    // ...
  },
  fanData: {
    happiness: 60,
    seasonTicketsSold: 0,
    // ...
  }
};
```

Maintain this structure or propose changes via discussion first.

## 🎨 Asset Guidelines

### Images

- Use WebP format when possible
- Optimize file sizes (< 500KB per image)
- Provide alt text for accessibility
- Use descriptive filenames
- Include attribution if using third-party assets

### Sounds (Future)

- Use MP3 or OGG format
- Keep file sizes small (< 100KB)
- Provide volume controls
- Ensure sounds are appropriate
- Include attribution

## 🔄 Development Workflow

### Branch Strategy

- `main` - Stable releases
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(match): add injury system during matches
fix(finances): correct weekly wage calculation
docs(readme): add installation instructions
refactor(ui): split game UI into components
```

## 🚀 Release Process

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Final testing
5. Merge to main
6. Tag release
7. Deploy
8. Announce

## 📞 Getting Help

- Check [ANALYSIS_AND_RECOMMENDATIONS.md](./ANALYSIS_AND_RECOMMENDATIONS.md)
- Read existing issues and PRs
- Ask questions in issue comments
- Join discussions

## 🎖️ Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Given credit in game credits (when available)

## 📋 Priority Areas

Currently seeking help with:
1. **Code Refactoring** - Breaking down monolithic files
2. **Testing** - Adding test coverage
3. **Documentation** - JSDoc comments and guides
4. **Performance** - Image optimization and code optimization
5. **Accessibility** - ARIA labels and keyboard navigation
6. **New Features** - See roadmap in README

## 🔐 Security

Found a security vulnerability?
- Do NOT create a public issue
- Email: [security contact to be added]
- Provide detailed information
- Allow time for fix before disclosure

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

**Thank you for contributing to Pitchside Professor!**

Together we can build an amazing football management game! ⚽
