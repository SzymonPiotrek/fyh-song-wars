# SONG WARS

Playlist-based battle royale game where every song becomes a unique stickman fighter.

## Overview

Import a Spotify playlist, and every song transforms into a stickman character with unique weapons, abilities, and combat stats based on the song's characteristics. All characters fight in an automated battle royale until one winner remains.

## Tech Stack

- **TypeScript** — Main language
- **PixiJS** — 2D graphics rendering
- **Matter.js** — Physics simulation
- **GSAP** — Animations
- **Express** — Backend server
- **Vite** — Dev server and build tool

## Project Structure

```
song-wars/
├── client/          # Frontend game code
├── server/          # Backend API
├── shared/          # Shared TypeScript types
└── tests/           # Unit tests
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Start the game client
npm run dev

# Start the backend server
npm run server
```

## How It Works

1. **Playlist Import** — Import a Spotify playlist
2. **Song Analysis** — Each song's characteristics are extracted
3. **Character Generation** — Songs become unique stickman fighters
4. **Relationship System** — Similar songs ally, different songs become rivals
5. **Battle Simulation** — Automated free-for-all combat
6. **Winner** — Last song standing wins

## Development Priorities

1. Basic battle prototype with placeholder characters
2. Character customization from song data
3. Relationship system (alliances & rivalries)
4. Spotify integration
5. Arena customization
6. Polish (UI, animations, effects)
