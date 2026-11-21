import * as PIXI from 'pixi.js';
import { BattleManager } from './game/systems/BattleManager';
import { StickmanRenderer } from './renderer/StickmanRenderer';
import { ArenaScene } from './game/scenes/ArenaScene';
import { showStartScreen, ImportResult } from './ui/StartScreen';

function startBattle(result: ImportResult) {
  // Initialize PixiJS application (v7 synchronous)
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x111111,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  document.getElementById('game-container')?.appendChild(app.view as HTMLElement);

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
    renderer.render(battleManager.getCharacters(), battleManager.getArena(), delta);
    arenaScene.render(battleManager.getArena());
  });
}

showStartScreen(startBattle);
