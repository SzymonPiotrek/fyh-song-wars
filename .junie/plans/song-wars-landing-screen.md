# Technical Design

### Current State

The Song Wars project is a **TypeScript monorepo** with Vite + PixiJS + Matter.js. The current start screen (`client/src/ui/StartScreen.ts`) is a minimal overlay with a playlist URL input and a "Start Battle" button on a plain black background. The HTML entry point is `client/index.html` with inline styles. The main client entry is `client/src/main.ts`.

**Files that will be modified:**
- `client/src/ui/StartScreen.ts` — replace the plain start screen with the Neon Battle Arena landing screen
- `client/index.html` — add Google Fonts import and update inline styles for the landing screen

**Files that will NOT be modified:**
- `client/src/main.ts` — no changes needed, it already calls `showStartScreen()`
- `server/` — no changes needed, the playlist import API remains the same
- `shared/types/` — no changes needed

### Proposed Visual Design

#### Concept: "Neon Battle Arena"

A dark, cinematic landing screen that feels like booting up a fighting game. Think Street Fighter meets Spotify.

**Color Palette:**
- **Background:** Deep dark purple-to-black gradient (`#0a0015` → `#1a0030`)
- **Primary accent:** Neon green (Spotify-inspired, `#1DB954`)
- **Secondary accent:** Electric purple (`#aa3bff`)
- **Text:** White with subtle glow effects
- **Highlights:** Warm gold for the title (`#ffd700`)

**Layout (full-screen, centered):**

1. **Animated background** — Subtle particle-like dots or pulsing energy lines floating across the dark background (pure CSS animation, no canvas needed).

2. **Title — "SONG WARS"** — Large, bold, centered text with:
   - A metallic/gold gradient fill
   - A subtle text-shadow glow effect
   - A slight letter-spacing for impact
   - An entrance animation (fade-in + scale-up)

3. **Tagline** — Below the title, smaller text:
   - *"Where playlists become battlegrounds"*
   - Subtle fade-in animation, slightly delayed after the title

4. **Playlist Input & Start Button** — The primary call-to-action:
   - Styled input field with dark background and neon border
   - Large, prominent "Start Battle" button with Spotify green (`#1DB954`)
   - Hover effect: glow + scale-up animation
   - Pulse animation to draw attention
   - This preserves the existing playlist URL input functionality

5. **How It Works Section** — Three simple steps below the button:
   - Step 1: "Paste a Spotify playlist link"
   - Step 2: "Songs become fighters"
   - Step 3: "Watch them battle"
   - Each step has a small icon and fades in sequentially

6. **Footer** — Small text at the bottom:
   - "Made for FYH Hackathon"

### Animations

All animations will be pure CSS (no libraries needed):
- **Title:** Fade-in + scale-up on page load (0.8s duration)
- **Tagline:** Fade-in with delay (1.2s after title)
- **Button:** Continuous subtle pulse glow (2s cycle)
- **Steps:** Sequential fade-in (0.3s delay between each)
- **Background:** Slow-moving gradient or floating particles
- **Hover effects:** Button scales up slightly, glow intensifies

### Responsive Design

- On desktop: Full layout with all elements visible
- On tablet: Steps stack vertically, title scales down
- On mobile: Compact layout, button full-width, steps in a single column

### Why This Design Fits

- **No framework dependencies** — Works perfectly with the existing TypeScript + Vite setup
- **No broken functionality** — The playlist input is preserved, wired to the existing API call
- **Lightweight** — CSS-only animations mean no heavy libraries to load
- **Hackathon-appropriate** — Visually impressive but achievable in a short timeframe
- **Scalable** — Easy to extend with more features (e.g. adding a "How to Play" modal, leaderboard preview, etc.)

### Technical Approach

- The landing screen will be rendered as HTML strings in `StartScreen.ts` (following the existing pattern)
- All styling will be inline/embedded CSS using CSS custom properties for the color palette
- CSS `@keyframes` for all animations
- CSS `@media` queries for responsive breakpoints
- The playlist input and start button will keep their existing `id` attributes so the existing event handler logic continues to work
- Google Fonts (Orbitron for the title) will be loaded in `index.html`

# Delivery Steps

### ✓ Step 1: Create the landing screen HTML structure
### ✓ Step 2: Implement the visual design and animations in CSS
Add all styling and animations to the landing screen.
- Define CSS custom properties for the color palette (dark background, neon green, purple, gold).
- Style the title with gradient text, glow effects, and large typography using Orbitron font.
- Implement CSS `@keyframes` animations: title entrance (fade + scale), tagline fade-in, button pulse glow, sequential step fade-ins, and background particle/gradient animation.
- Style the playlist input with dark theme and neon border.
- Style the Start Battle button with green background, hover effects (glow + scale), and the pulse animation.
- Add responsive `@media` queries for tablet (≤1024px) and mobile (≤600px) breakpoints.
- Test that the screen looks polished on different screen sizes.
