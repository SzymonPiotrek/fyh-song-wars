import { Character } from '../../../shared/types/Character';
import { Arena } from '../../../shared/types/Arena';
import { Playlist } from '../../../shared/types/Playlist';
import { Relationship } from '../../../shared/types/Relationship';

export interface ImportResult {
  playlist: Playlist;
  characters: Character[];
  relationships: Relationship[];
  arena: Arena;
}

export function showStartScreen(onReady: (result: ImportResult) => void) {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;

  overlay.innerHTML = `
    <style>
      /* ===== CSS Custom Properties ===== */
      :root {
        --sw-bg-dark: #0a0015;
        --sw-bg-light: #1a0030;
        --sw-green: #1DB954;
        --sw-green-glow: rgba(29, 185, 84, 0.4);
        --sw-purple: #aa3bff;
        --sw-purple-glow: rgba(170, 59, 255, 0.3);
        --sw-gold: #ffd700;
        --sw-gold-glow: rgba(255, 215, 0, 0.5);
        --sw-white: #ffffff;
        --sw-text-muted: #b0a0c0;
        --sw-input-bg: rgba(255, 255, 255, 0.06);
        --sw-input-border: rgba(170, 59, 255, 0.4);
      }

      /* ===== Landing Container ===== */
      .sw-landing {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--sw-bg-dark) 0%, var(--sw-bg-light) 50%, #0d0020 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      /* ===== Animated Background Particles ===== */
      .sw-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
      }

      .sw-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--sw-purple);
        border-radius: 50%;
        opacity: 0;
        animation: sw-float-particle 6s infinite ease-in-out;
        animation-delay: calc(var(--i) * 0.3s);
        left: calc((var(--i) % 5) * 20% + 10%);
        top: calc((var(--i) % 7) * 14% + 5%);
      }

      .sw-particle:nth-child(odd) {
        background: var(--sw-green);
        width: 3px;
        height: 3px;
      }

      .sw-particle:nth-child(3n) {
        background: var(--sw-gold);
        width: 5px;
        height: 5px;
      }

      @keyframes sw-float-particle {
        0% {
          opacity: 0;
          transform: translateY(0) scale(0.5);
        }
        25% {
          opacity: 0.8;
          transform: translateY(-30px) scale(1);
        }
        50% {
          opacity: 0.4;
          transform: translateY(-60px) scale(0.8);
        }
        75% {
          opacity: 0.6;
          transform: translateY(-90px) scale(1.1);
        }
        100% {
          opacity: 0;
          transform: translateY(-120px) scale(0.5);
        }
      }

      /* ===== Background Energy Lines ===== */
      .sw-landing::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
          radial-gradient(ellipse at 20% 50%, var(--sw-purple-glow) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 50%, var(--sw-green-glow) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 0%, var(--sw-gold-glow) 0%, transparent 40%);
        animation: sw-energy-pulse 4s ease-in-out infinite alternate;
        pointer-events: none;
      }

      @keyframes sw-energy-pulse {
        0% { opacity: 0.3; }
        100% { opacity: 0.7; }
      }

      /* ===== Main Content ===== */
      .sw-content {
        position: relative;
        z-index: 1;
        text-align: center;
        max-width: 700px;
        width: 90%;
        padding: 40px 20px;
      }

      /* ===== Title ===== */
      .sw-title {
        margin: 0 0 16px;
        animation: sw-title-entrance 0.8s ease-out forwards;
        opacity: 0;
        transform: scale(0.8);
      }

      .sw-title-text {
        font-family: 'Orbitron', 'Segoe UI', sans-serif;
        font-size: 72px;
        font-weight: 900;
        letter-spacing: 8px;
        background: linear-gradient(180deg, #fff 0%, var(--sw-gold) 50%, #ff8c00 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 0 20px var(--sw-gold-glow)) drop-shadow(0 0 40px rgba(255, 215, 0, 0.3));
        display: inline-block;
      }

      @keyframes sw-title-entrance {
        0% {
          opacity: 0;
          transform: scale(0.8) translateY(20px);
        }
        60% {
          opacity: 1;
          transform: scale(1.05) translateY(-5px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      /* ===== Tagline ===== */
      .sw-tagline {
        font-size: 20px;
        color: var(--sw-text-muted);
        margin: 0 0 50px;
        font-weight: 300;
        letter-spacing: 2px;
        animation: sw-fade-in 0.8s ease-out 1.2s forwards;
        opacity: 0;
      }

      @keyframes sw-fade-in {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ===== Input Section ===== */
      .sw-input-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-bottom: 60px;
        animation: sw-fade-in 0.8s ease-out 1.6s forwards;
        opacity: 0;
      }

      .sw-input {
        width: 100%;
        max-width: 500px;
        padding: 16px 20px;
        font-size: 16px;
        font-family: 'Inter', sans-serif;
        background: var(--sw-input-bg);
        border: 2px solid var(--sw-input-border);
        border-radius: 12px;
        color: var(--sw-white);
        outline: none;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      }

      .sw-input::placeholder {
        color: rgba(176, 160, 192, 0.6);
      }

      .sw-input:focus {
        border-color: var(--sw-purple);
        box-shadow: 0 0 20px var(--sw-purple-glow), 0 0 40px rgba(170, 59, 255, 0.15);
      }

      /* ===== Start Button ===== */
      .sw-start-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 18px 40px;
        font-size: 18px;
        font-family: 'Orbitron', sans-serif;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        background: linear-gradient(135deg, var(--sw-green) 0%, #1ed760 100%);
        color: #000;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        animation: sw-button-pulse 2s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }

      .sw-start-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }

      .sw-start-btn:hover::before {
        left: 100%;
      }

      .sw-start-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 0 30px var(--sw-green-glow), 0 0 60px rgba(29, 185, 84, 0.2);
      }

      .sw-start-btn:active {
        transform: scale(0.98);
      }

      .sw-start-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        animation: none;
      }

      .sw-btn-icon {
        flex-shrink: 0;
      }

      @keyframes sw-button-pulse {
        0%, 100% {
          box-shadow: 0 0 15px var(--sw-green-glow);
        }
        50% {
          box-shadow: 0 0 30px var(--sw-green-glow), 0 0 60px rgba(29, 185, 84, 0.15);
        }
      }

      /* ===== Status Text ===== */
      .sw-status {
        font-size: 14px;
        color: var(--sw-text-muted);
        margin: 0;
        min-height: 20px;
        transition: color 0.3s ease;
      }

      /* ===== How It Works Steps ===== */
      .sw-steps {
        display: flex;
        gap: 30px;
        justify-content: center;
        margin-bottom: 50px;
      }

      .sw-step {
        flex: 1;
        max-width: 200px;
        text-align: center;
        opacity: 0;
        animation: sw-step-fade-in 0.6s ease-out forwards;
        animation-delay: calc(2s + (var(--step) - 1) * 0.3s);
      }

      .sw-step-icon {
        width: 60px;
        height: 60px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--sw-purple) 0%, var(--sw-green) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--sw-white);
        box-shadow: 0 0 20px var(--sw-purple-glow);
      }

      .sw-step-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: var(--sw-white);
        margin: 0 0 8px;
        letter-spacing: 1px;
      }

      .sw-step-desc {
        font-size: 13px;
        color: var(--sw-text-muted);
        margin: 0;
        line-height: 1.5;
      }

      @keyframes sw-step-fade-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ===== Footer ===== */
      .sw-footer {
        padding: 20px 0;
        opacity: 0;
        animation: sw-fade-in 0.6s ease-out 2.8s forwards;
      }

      .sw-footer p {
        font-size: 13px;
        color: rgba(176, 160, 192, 0.5);
        margin: 0;
      }

      .sw-footer strong {
        color: var(--sw-purple);
        font-weight: 600;
      }

      /* ===== Responsive: Tablet ===== */
      @media (max-width: 1024px) {
        .sw-title-text {
          font-size: 56px;
          letter-spacing: 6px;
        }
        .sw-tagline {
          font-size: 18px;
        }
        .sw-steps {
          gap: 20px;
        }
      }

      /* ===== Responsive: Mobile ===== */
      @media (max-width: 600px) {
        .sw-title-text {
          font-size: 36px;
          letter-spacing: 4px;
        }
        .sw-tagline {
          font-size: 15px;
          margin-bottom: 36px;
        }
        .sw-input-section {
          margin-bottom: 40px;
        }
        .sw-input {
          padding: 14px 16px;
          font-size: 14px;
        }
        .sw-start-btn {
          padding: 16px 32px;
          font-size: 14px;
          width: 100%;
          max-width: 320px;
          justify-content: center;
        }
        .sw-steps {
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .sw-step {
          max-width: 280px;
        }
        .sw-step-icon {
          width: 50px;
          height: 50px;
        }
        .sw-step-title {
          font-size: 13px;
        }
        .sw-step-desc {
          font-size: 12px;
        }
      }
    </style>

    <div class="sw-landing">
      <!-- Animated background particles -->
      <div class="sw-particles">
        <span class="sw-particle" style="--i:1"></span>
        <span class="sw-particle" style="--i:2"></span>
        <span class="sw-particle" style="--i:3"></span>
        <span class="sw-particle" style="--i:4"></span>
        <span class="sw-particle" style="--i:5"></span>
        <span class="sw-particle" style="--i:6"></span>
        <span class="sw-particle" style="--i:7"></span>
        <span class="sw-particle" style="--i:8"></span>
        <span class="sw-particle" style="--i:9"></span>
        <span class="sw-particle" style="--i:10"></span>
        <span class="sw-particle" style="--i:11"></span>
        <span class="sw-particle" style="--i:12"></span>
        <span class="sw-particle" style="--i:13"></span>
        <span class="sw-particle" style="--i:14"></span>
        <span class="sw-particle" style="--i:15"></span>
        <span class="sw-particle" style="--i:16"></span>
        <span class="sw-particle" style="--i:17"></span>
        <span class="sw-particle" style="--i:18"></span>
        <span class="sw-particle" style="--i:19"></span>
        <span class="sw-particle" style="--i:20"></span>
      </div>

      <!-- Main content container -->
      <div class="sw-content">

        <!-- Title -->
        <h1 class="sw-title" aria-label="Song Wars">
          <span class="sw-title-text">SONG WARS</span>
        </h1>

        <!-- Tagline -->
        <p class="sw-tagline">Where playlists become battlegrounds</p>

        <!-- Input & Button section -->
        <div class="sw-input-section">
          <input
            id="playlist-input"
            type="text"
            class="sw-input"
            placeholder="Paste your Spotify playlist link..."
            aria-label="Spotify playlist URL"
          />
          <button
            id="start-button"
            type="button"
            class="sw-start-btn"
            aria-label="Start the battle"
          >
            <svg class="sw-btn-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.119 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span class="sw-btn-text">Start Battle</span>
          </button>
          <p id="start-status" class="sw-status" aria-live="polite"></p>
        </div>

        <!-- How It Works section -->
        <div class="sw-steps">
          <div class="sw-step" style="--step: 1">
            <div class="sw-step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h3 class="sw-step-title">Paste a Playlist</h3>
            <p class="sw-step-desc">Paste any Spotify playlist link to begin</p>
          </div>
          <div class="sw-step" style="--step: 2">
            <div class="sw-step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3 class="sw-step-title">Songs Become Fighters</h3>
            <p class="sw-step-desc">Each track transforms into a unique character</p>
          </div>
          <div class="sw-step" style="--step: 3">
            <div class="sw-step-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h3 class="sw-step-title">Watch Them Battle</h3>
            <p class="sw-step-desc">Cheer for your favorite song as it fights to the end</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="sw-footer">
          <p>Made for <strong>FYH Hackathon</strong></p>
        </div>

      </div>
    </div>
  `;

  const input = document.getElementById('playlist-input') as HTMLInputElement;
  const button = document.getElementById('start-button') as HTMLButtonElement;
  const status = document.getElementById('start-status') as HTMLParagraphElement;

  button.addEventListener('click', async () => {
    const playlistUrl = input.value.trim();
    if (!playlistUrl) {
      status.textContent = '⚠️ Paste a playlist link first.';
      status.style.color = '#ff6b6b';
      return;
    }

    button.disabled = true;
    status.textContent = '⚔️ Loading arena and fighters...';
    status.style.color = '#1DB954';

    try {
      const response = await fetch('http://localhost:3001/api/playlist/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl })
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? `Request failed (${response.status})`);
      }

      overlay.innerHTML = '';
      onReady(body as ImportResult);
    } catch (error) {
      status.textContent = error instanceof Error ? `❌ ${error.message}` : '❌ Something went wrong.';
      status.style.color = '#ff6b6b';
      button.disabled = false;
    }
  });

  // Allow pressing Enter to start
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      button.click();
    }
  });
}
