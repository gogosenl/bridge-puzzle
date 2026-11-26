# Trail Builder: Route Craft

Trail Builder is a mobile route-building puzzle game developed with React Native and Expo. Players construct a continuous bridge from the starting point to the destination while satisfying row and column constraints, navigating obstacles, and using special route mechanics.

The project was designed as a complete mobile game experience rather than a standalone puzzle prototype. It includes 500 validated levels, progressive difficulty, persistent progression, an in-game economy, bilingual UI, audio, animations, onboarding, and iPhone/iPad support.

## Project status

- Version: `1.0.0`
- Primary platform: iOS and iPadOS
- Additional support: Android and web development builds
- Languages: English and Turkish
- Account required: No
- Online connection required: No

## Gameplay

Players draw a route across a grid by placing bridge segments one cell at a time. The completed route must connect the hiker to the destination and match the numerical clues shown for every row and column.

The difficulty increases through larger boards, longer routes, tighter clue combinations, blocked cells, checkpoints, and one-way passages. Route pieces automatically form straight sections and rounded corners based on the player's movement.

## Key features

- 500 unique and validated puzzle levels
- 10 progression layers ranging from 4x4 to 10x10 boards
- Gradually increasing route length, turn count, and mechanical complexity
- Row and column clues with clear success and overflow feedback
- Touch and drag route construction with animated placement and removal
- Automatically aligned straight bridges and rounded corner pieces
- Obstacles, mandatory checkpoints, and one-way passages
- Contextual tutorials shown on the first encounter with each mechanic
- Three-star level scoring and persistent completion records
- Hint currency and layer currency earned through gameplay
- Unlockable progression layers with a balanced reward curve
- Animated splash screen, level transitions, and completion effects
- Original ambient music, gameplay sound effects, and haptic feedback
- Independent music and sound controls
- English and Turkish localization
- Offline-first gameplay with no account or authentication requirement

## Engineering highlights

### Deterministic level pipeline

Levels are generated from fixed seeds, making the output reproducible across machines and builds. A dedicated validation script checks all 500 levels for uniqueness and structural correctness before release.

### Responsive route interaction

The board converts pointer or touch movement into grid-aware route updates. Placement and rollback are processed sequentially to preserve visual continuity, while direction changes select the correct straight or curved bridge asset.

### Local-first state management

Progress, stars, currencies, settings, and tutorial completion are stored locally. Native builds use SQLite-backed persistence, with platform-specific state adapters for the web target.

### Mobile-focused presentation

The interface is designed around portrait mobile play, safe-area support, scalable grid sizes, touch-friendly controls, and lightweight animated feedback. Native route transitions are handled with Expo Router.

## Technology stack

| Area | Technology |
| --- | --- |
| Application | React Native 0.86, React 19, TypeScript |
| Runtime and tooling | Expo SDK 57, EAS Build |
| Navigation | Expo Router with typed routes |
| Animation | React Native Reanimated |
| Input | React Native Gesture Handler |
| Persistence | Expo SQLite and platform-specific local state |
| Audio | Expo Audio |
| Device feedback | Expo Haptics |
| UI and assets | Expo Image, Expo Symbols, custom game assets |
| Code quality | ESLint, TypeScript, custom level validator |

## Project structure

```text
assets/
  audio/             Music and gameplay sound effects
  game/              Bridge, obstacle, checkpoint, and environment assets
  images/            App icon, splash screen, and platform images
  ui/                Currency, level, logo, and interface assets
scripts/
  generate-levels.cjs
  validate-levels.cjs
src/
  app/               Expo Router screens
  components/        Reusable game and interface components
  game/              Level data, puzzle logic, and game types
  i18n/              English and Turkish translations
  state/             Audio, settings, and progression state
```

## Getting started

### Requirements

- Node.js LTS
- npm
- Expo Go for device testing, or an Expo development build

### Installation

```bash
git clone https://github.com/gogosenl/bridge-puzzle.git
cd bridge-puzzle
npm install
npx expo start --lan
```

Scan the QR code with Expo Go while the computer and phone are connected to the same network. If the LAN connection is unavailable, start Expo with tunnel mode:

```bash
npx expo start --tunnel
```

On Windows PowerShell systems that block `npm.ps1` or `npx.ps1`, use the command wrappers directly:

```powershell
npm.cmd install
npx.cmd expo start --lan
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run validate-levels
```

The level validator currently confirms:

```text
Validated 500 unique levels in 10 layers (4x4 through 10x10).
```

## Regenerating levels

```bash
npm run generate-levels
npm run validate-levels
```

The generator uses fixed seeds, so the same source produces the same level set.

## Privacy

Trail Builder does not require user registration and does not depend on authentication, advertising, analytics, payment processing, or third-party cloud services for its core functionality. Game progress and preferences remain on the device.

## Author

Developed by [Görkem Şenol](https://github.com/gogosenl) as an end-to-end mobile game project covering game design, interaction design, progression systems, asset integration, localization, persistence, testing, and iOS release preparation.

## License

Copyright © 2026 Görkem Şenol. All rights reserved.

This repository is public for portfolio review and evaluation only. Copying, modifying, distributing, publishing, selling, or reusing the source code, game design, level data, audio, visual assets, branding, or documentation is not permitted without prior written permission. See the [license notice](LICENSE) for details.
