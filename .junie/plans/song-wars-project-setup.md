---
sessionId: session-261121-134521-1049
---

# Technical Design

### Current State
The project is essentially empty — a Java template (`src/Main.java`) with no TypeScript, no `package.json`, and no web infrastructure. The `.git` repository exists and is connected to GitHub at `https://github.com/SzymonPiotrek/fyh-song-wars.git`.

### Key Decisions

**1. Monorepo structure with client/server/shared folders**
All code lives in one repository. The `shared/` folder contains TypeScript interfaces used by both client and server. This keeps the project simple for a hackathon while maintaining clean separation.

**2. System-based game architecture (not entity-component-library)**
Game logic is organized into discrete systems (BattleManager, CombatSystem, CharacterAI, PhysicsSystem) that operate on character data. PixiJS handles rendering only. This keeps simulation independent of graphics.

**3. Placeholder characters first, Spotify later**
We prove the battle simulation works with hardcoded placeholder data before integrating Spotify. This avoids spending time on API auth when the core game isn't proven yet.

**4. Prebuilt arena themes, customized by colour analysis**
Instead of procedural generation, we define several arena templates (volcanic, neon, forest, floating) and customize their colours, lighting, and decorations based on album artwork analysis.

### Proposed Changes

#### Phase 1: Project Foundation
- Remove the Java template (`src/Main.java`).
- Initialize `package.json` with all dependencies (pixi.js, matter, gsap, express, zod, vitest, vite, typescript).
- Configure `tsconfig.json` for both client and server compilation.
- Configure `vite.config.ts` for the dev server.
- Create `.gitignore` for Node.js/TypeScript projects.
- Set up the folder structure:
  - `client/src/game/` (scenes, entities, systems, physics)
  - `client/src/ui/`
  - `client/src/assets/`
  - `server/src/` (routes, spotify, analysis)
  - `shared/types/` (Song, Character, Relationship, Arena)

#### Phase 2: Shared TypeScript Interfaces
Define the core data contracts in `shared/types/`:
- **Song.ts** — title, artist, album, artwork URL, characteristics.
- **Character.ts** — stickman properties, combat stats, weapon, abilities, relationships.
- **Relationship.ts** — pair of characters with a score (-100 to +100).
- **Arena.ts** — theme, colours, obstacles, visual properties.

#### Phase 3: Basic Battle Prototype (Priority 1)
- **PhysicsSystem** — Matter.js integration for collision detection and movement physics.
- **BattleManager** — Controls the battle lifecycle (start, update loop, end, winner).
- **CombatSystem** — Handles attacks, damage, weapons, and elimination.
- **CharacterAI** — Simple decision-making: find nearest opponent, move, attack.
- **StickmanRenderer** — PixiJS rendering of stickman characters with basic animations.
- **ArenaScene** — Basic arena rendering with boundaries.
- **Placeholder data** — ~10 hardcoded characters with varied stats for testing.

#### Phase 4: Character Customisation (Priority 2)
- **CharacterGenerator** — Converts song characteristics into character data.
- **SongAnalyser** — Extracts/derives characteristics from available metadata.
- Visual differentiation: colours, weapon types, size variations.

#### Phase 5: Relationship System (Priority 3)
- **RelationshipManager** — Calculates similarity scores between songs.
- AI behaviour modifications for allies (protect, coordinate) and rivals (prioritize attacks, bonuses).

#### Phase 6: UI Layer
- **UIManager** — Loading screen, battle HUD (health bars, kill feed), winner screen.
- HTML/CSS menus overlaid on the PixiJS canvas.
- GSAP animations for transitions.

#### Phase 7: Spotify Integration (Priority 4)
- **Express backend** with routes for playlist import.
- **Spotify service** — OAuth flow and playlist retrieval.
- Secure credential handling via environment variables.

#### Phase 8: Arena Customisation (Priority 5)
- **ArenaGenerator** — Analyses album artwork colours and selects/customizes arena theme.
- Prebuilt arena templates with dynamic colour application.

### File Structure
```
song-wars/
├── client/
│   ├── src/
│   │   ├── game/
│   │   │   ├── scenes/
│   │   │   │   └── ArenaScene.ts
│   │   │   ├── entities/
│   │   │   │   └── Stickman.ts
│   │   │   ├── systems/
│   │   │   │   ├── BattleManager.ts
│   │   │   │   ├── CombatSystem.ts
│   │   │   │   ├── CharacterAI.ts
│   │   │   │   ├── PhysicsSystem.ts
│   │   │   │   ├── CharacterGenerator.ts
│   │   │   │   ├── RelationshipManager.ts
│   │   │   │   ├── SongAnalyser.ts
│   │   │   │   └── ArenaGenerator.ts
│   │   │   └── physics/
│   │   │       └── (Matter.js world config)
│   │   ├── ui/
│   │   │   └── UIManager.ts
│   │   ├── renderer/
│   │   │   └── StickmanRenderer.ts
│   │   └── main.ts
│   └── index.html
├── server/
│   └── src/
│       ├── routes/
│       │   └── playlist.ts
│       ├── spotify/
│       │   └── SpotifyService.ts
│       ├── analysis/
│       │   └── (shared with client analysis)
│       └── index.ts
├── shared/
│   └── types/
│       ├── Song.ts
│       ├── Character.ts
│       ├── Relationship.ts
│       └── Arena.ts
├── tests/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
```

### Architecture Diagram

``` mermaid
graph LR
    UI[UIManager HTML/CSS] --> Canvas[PixiJS Canvas]
    Canvas --> Renderer[StickmanRenderer]
    Renderer --> BM[BattleManager]
    BM --> AI[CharacterAI]
    BM --> CS[CombatSystem]
    BM --> PS[PhysicsSystem Matter.js]
    AI --> RM[RelationshipManager]
    CS --> CG[CharacterGenerator]
    CG --> SA[SongAnalyser]
    BM --> AG[ArenaGenerator]
    UI --> Server[Express Backend]
    Server --> SS[SpotifyService]
    SS --> API[Spotify API]
```

### Risks
- **Many characters performance**: With 50+ stickmen, collision detection and AI updates per frame could become expensive. Mitigation: spatial partitioning in Matter.js, simplified AI for distant characters.
- **Spotify API restrictions**: New apps may not get Audio Features. Mitigation: the SongAnalyser derives characteristics from available metadata and deterministic mappings.
- **Hackathon timeline**: Scope creep is the biggest risk. Mitigation: strict priority ordering — battle prototype must work before anything else.

# Delivery Steps

### ✓ Step 1: Initialize project foundation and shared types
Set up the TypeScript monorepo structure with all configuration files and core data contracts.
- Remove `src/Main.java` and the Java project template.
- Create `package.json` with dependencies: pixi.js, matter, gsap, express, @types/express, zod, vitest, vite, typescript, sharp.
- Create `tsconfig.json` with paths for client, server, and shared modules.
- Create `vite.config.ts` for the dev server with alias resolution for `shared/`.
- Create `.gitignore` for Node.js/TypeScript (node_modules, dist, .env, etc.).
- Create `client/index.html` as the main entry point with a canvas container.
- Create `client/src/main.ts` as the client entry point.
- Create `server/src/index.ts` as the Express server entry point.
- Create shared type interfaces: `shared/types/Song.ts`, `Character.ts`, `Relationship.ts`, `Arena.ts`.
- Create `README.md` with project overview.

### ✓ Step 2: Implement basic battle prototype with placeholder characters
Build a working battle simulation with ~10 hardcoded stickmen that fight until one winner remains.
- ✓ Create `PhysicsSystem.ts` — initializes Matter.js world with arena boundaries and collision detection.
- ✓ Create `BattleManager.ts` — main game loop, character spawning, battle lifecycle (start/update/end), winner detection.
- ✓ Create `CombatSystem.ts` — attack execution, damage calculation, health tracking, elimination logic.
- ✓ Create `CharacterAI.ts` — simple behaviour: find nearest target, move toward it, attack when in range.
- ✓ Create `StickmanRenderer.ts` — PixiJS rendering of stickman figures with basic attack animations.
- ✓ Create `ArenaScene.ts` — renders the arena background, boundaries, and obstacles.
- ✓ Create placeholder character data (~10 characters with varied stats, colours, and weapon types).
- ✓ Wire everything together in `client/src/main.ts` so the battle runs on page load.
- ⏸ Verify the battle finishes with a single winner (dev server running at localhost:3000)

###   Step 3: Add character customisation and song analysis systems
Enable song-based character generation with unique visuals and combat stats.
- Create `SongAnalyser.ts` — derives characteristics (energy, tempo, mood, genre) from available song metadata using deterministic mappings.
- Create `CharacterGenerator.ts` — converts song characteristics into Character objects with stats, weapon, colour scheme, and abilities.
- Update `StickmanRenderer.ts` to render different weapon types, colours, and visual variations.
- Update `BattleManager` to accept character data from CharacterGenerator instead of hardcoded placeholders.
- Create a small test playlist of 10 songs with placeholder metadata to validate the pipeline.

###   Step 4: Implement relationship system with gameplay consequences
Calculate and enforce alliances and rivalries between characters based on song similarity.
- Create `RelationshipManager.ts` — computes similarity scores (-100 to +100) between all character pairs based on genre, mood, tempo, and style.
- Update `CharacterAI.ts` to respect relationships: allies avoid attacking each other and may protect one another; rivals prioritize attacks and receive combat bonuses.
- Add relationship visualization to the UI (e.g., coloured lines or indicators between allied/rival characters).
- Test with the placeholder playlist to verify alliances and rivalries affect battle outcomes.

###   Step 5: Add UI layer and Spotify integration
Build the user-facing interface and connect to Spotify for real playlist imports.
- Create `UIManager.ts` — manages HTML/CSS overlays for loading screen, battle HUD (health bars, kill feed, character names), and winner screen.
- Add GSAP animations for character introductions, transitions, and the winner announcement.
- Create `server/src/spotify/SpotifyService.ts` — handles OAuth flow and playlist retrieval from Spotify API.
- Create `server/src/routes/playlist.ts` — Express endpoint for importing a playlist by URL.
- Configure environment variables for Spotify credentials (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI).
- Wire the frontend to call the backend, receive playlist data, and start the battle with real songs.
- Provide a Spotify link to the winning track on the results screen.