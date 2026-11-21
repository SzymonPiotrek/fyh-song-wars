import * as PIXI from 'pixi.js';
import { BattleManager } from './game/systems/BattleManager';
import { StickmanRenderer } from './renderer/StickmanRenderer';
import { ArenaScene } from './game/scenes/ArenaScene';
import { showStartScreen, ImportResult } from './ui/StartScreen';
import { ArenaTheme } from 'shared/Arena';

const THEME_LABELS: Record<ArenaTheme, string> = {
  [ArenaTheme.Volcanic]: '🌋 Volcanic Arena',
  [ArenaTheme.Neon]: '💡 Neon Arena',
  [ArenaTheme.Forest]: '🌲 Forest Arena',
  [ArenaTheme.Floating]: '☁️ Floating Arena',
  [ArenaTheme.Desert]: '🏜️ Desert Arena',
  [ArenaTheme.Ocean]: '🌊 Ocean Arena',
  [ArenaTheme.Space]: '🌌 Space Arena',
  [ArenaTheme.Cyberpunk]: '🤖 Cyberpunk Arena'
};

function showArenaIntro(arena: ImportResult['arena']): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) {
      resolve();
      return;
    }

    const themeLabel = THEME_LABELS[arena.theme] ?? '⚔️ Battle Arena';
    const moodText = arena.moodKeywords.length > 0
      ? arena.moodKeywords.slice(0, 5).join(' • ')
      : 'Prepare for battle';
    const bgColor = arena.colors.primary || '#1a1a2e';
    const accentColor = arena.colors.accent || '#aa3bff';

    overlay.innerHTML = `
      <style>
        .arena-intro {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, ${bgColor} 0%, #000000 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          animation: arena-intro-fade-in 0.5s ease-out forwards;
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .arena-intro-theme {
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          font-size: 48px;
          font-weight: 900;
          color: ${accentColor};
          text-shadow: 0 0 30px ${accentColor}80, 0 0 60px ${accentColor}40;
          margin-bottom: 20px;
          animation: arena-intro-scale 0.6s ease-out forwards;
          opacity: 0;
          transform: scale(0.8);
        }
        .arena-intro-mood {
          font-size: 18px;
          color: #b0a0c0;
          letter-spacing: 3px;
          text-transform: uppercase;
          animation: arena-intro-fade-up 0.6s ease-out 0.3s forwards;
          opacity: 0;
          transform: translateY(15px);
        }
        .arena-intro-architecture {
          font-size: 14px;
          color: #807090;
          margin-top: 15px;
          animation: arena-intro-fade-up 0.6s ease-out 0.5s forwards;
          opacity: 0;
          transform: translateY(10px);
        }
        @keyframes arena-intro-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes arena-intro-scale {
          0% { opacity: 0; transform: scale(0.8); }
          60% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes arena-intro-fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes arena-intro-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      </style>
      <div class="arena-intro">
        <div class="arena-intro-theme">${themeLabel}</div>
        <div class="arena-intro-mood">${moodText}</div>
        ${arena.architecture ? `<div class="arena-intro-architecture">${arena.architecture.charAt(0).toUpperCase() + arena.architecture.slice(1)} Architecture</div>` : ''}
      </div>
    `;

    // Auto-advance after 2.5 seconds
    setTimeout(() => {
      const intro = overlay.querySelector('.arena-intro');
      if (intro) {
        (intro as HTMLElement).style.animation = 'arena-intro-fade-out 0.5s ease-out forwards';
      }
      setTimeout(() => {
        overlay.innerHTML = '';
        resolve();
      }, 500);
    }, 2500);
  });
}

function startBattle(result: ImportResult) {
  // Show arena introduction first, then start the battle
  showArenaIntro(result.arena).then(() => {
    startBattleGame(result);
  });
}

function startBattleGame(result: ImportResult) {
  // Initialize PixiJS application (v7 synchronous)
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x111111,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  document.getElementById('game-container')?.appendChild(app.view as unknown as HTMLElement);

  // Create game systems
  const arenaScene = new ArenaScene(app.stage);
  const renderer = new StickmanRenderer(app.stage);
  const battleManager = new BattleManager(result.characters, result.arena);

  // Handle winner
  battleManager.setOnWinnerAnnounced((winner) => {
    console.log('🏆 Winner:', winner.song.title, 'by', winner.song.artist);
    const overlay = document.getElementById('ui-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
          <h1 style="font-size: 48px; margin-bottom: 20px; color: #FFD700;">🏆 Winner!</h1>
          <h2 style="font-size: 36px; margin-bottom: 10px;">${winner.song.title}</h2>
          <p style="font-size: 24px; color: #aaa;">${winner.song.artist}</p>
          <p style="font-size: 18px; color: #888; margin-top: 20px;">Kills: ${winner.kills}</p>
          ${winner.song.spotifyUrl ? `<p style="margin-top: 15px;"><a href="${winner.song.spotifyUrl}" target="_blank" style="color: #1DB954; font-size: 18px;">Listen on Spotify</a></p>` : ''}
          <button onclick="location.reload()" style="
            margin-top: 30px;
            padding: 15px 30px;
            font-size: 18px;
            background: #FFD700;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          ">Play Again</button>
        </div>
      `;
    }
  });

  // Handle resize
  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    battleManager.getArena().width = window.innerWidth;
    battleManager.getArena().height = window.innerHeight;
  });

  // Start the battle
  battleManager.start();

  // Game loop
  app.ticker.add((delta) => {
    battleManager.update(delta);

    const phase = battleManager.getPhase();
    const isEntrance = phase === 'entrance';

    // Render characters (ragdoll during entrance, normal during fight)
    const entranceAnim = battleManager.getEntranceAnimation();
    const ragdollParts = isEntrance ? entranceAnim.getRagdollPartsMap() : undefined;
    renderer.render(battleManager.getCharacters(), battleManager.getArena(), delta, isEntrance, ragdollParts);

    // Render arena (with chute during entrance)
    arenaScene.render(battleManager.getArena(), false, isEntrance);
  });
}

showStartScreen(startBattle);
