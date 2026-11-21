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
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      width: 500px;
    ">
      <h1 style="font-size: 48px; margin-bottom: 30px; color: #FFD700;">SONG WARS</h1>
      <input id="playlist-input" type="text" placeholder="Paste your Spotify playlist link" style="
        width: 100%;
        padding: 12px;
        font-size: 16px;
        border-radius: 8px;
        border: none;
        margin-bottom: 15px;
      " />
      <button id="start-button" style="
        padding: 15px 30px;
        font-size: 18px;
        background: #FFD700;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      ">Start Battle</button>
      <p id="start-status" style="margin-top: 20px; color: #aaa;"></p>
    </div>
  `;

  const input = document.getElementById('playlist-input') as HTMLInputElement;
  const button = document.getElementById('start-button') as HTMLButtonElement;
  const status = document.getElementById('start-status') as HTMLParagraphElement;

  button.addEventListener('click', async () => {
    const playlistUrl = input.value.trim();
    if (!playlistUrl) {
      status.textContent = 'Paste a playlist link first.';
      return;
    }

    button.disabled = true;
    status.textContent = 'Loading arena and fighters...';

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
      status.textContent = error instanceof Error ? error.message : 'Something went wrong.';
      button.disabled = false;
    }
  });
}
