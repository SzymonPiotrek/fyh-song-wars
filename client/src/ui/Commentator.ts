import { CommentaryEvent } from '../../../shared/types/Commentary';

const API_BASE = 'http://localhost:3001';
const DISPLAY_DURATION_MS = 4200;
const MAX_QUEUE_LENGTH = 4;

export interface Commentator {
  react(event: CommentaryEvent): void;
}

export function createCommentator(container: HTMLElement): Commentator {
  const root = document.createElement('div');
  root.className = 'sw-commentator';
  root.innerHTML = `
    <style>
      .sw-commentator {
        position: absolute;
        left: 20px;
        bottom: 20px;
        display: flex;
        align-items: flex-end;
        gap: 16px;
        max-width: 640px;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 10;
      }
      .sw-commentator-avatar-wrap {
        flex-shrink: 0;
        width: 84px;
        height: 84px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid #ffd700;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        background: #111;
      }
      .sw-commentator-avatar-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .sw-commentator-avatar-wrap.is-talking {
        animation: sw-commentator-bounce 0.35s ease-in-out infinite;
      }
      @keyframes sw-commentator-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .sw-commentator-bubble {
        position: relative;
        background: rgba(10, 0, 21, 0.85);
        border: 2px solid rgba(255, 215, 0, 0.5);
        border-radius: 14px;
        padding: 14px 18px;
        color: #fff;
        font-size: 16px;
        line-height: 1.4;
        min-height: 24px;
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      .sw-commentator-bubble.is-visible {
        opacity: 1;
        transform: translateY(0);
      }
    </style>
    <div class="sw-commentator-avatar-wrap">
      <img src="/commentator-avatar.png" alt="Commentator" />
    </div>
    <div class="sw-commentator-bubble"></div>
  `;
  container.appendChild(root);

  const avatar = root.querySelector('.sw-commentator-avatar-wrap') as HTMLElement;
  const bubble = root.querySelector('.sw-commentator-bubble') as HTMLElement;

  const queue: CommentaryEvent[] = [];
  let speaking = false;

  function enqueue(event: CommentaryEvent) {
    if (event.type === 'winner') {
      queue.length = 0; // the final call always takes priority
    } else if (queue.length >= MAX_QUEUE_LENGTH) {
      return; // too much happening at once, drop it
    }
    queue.push(event);
    void processQueue();
  }

  async function processQueue() {
    if (speaking || queue.length === 0) return;
    const event = queue.shift()!;
    speaking = true;

    let text: string;
    try {
      const response = await fetch(`${API_BASE}/api/commentary/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      const body = await response.json();
      text = typeof body.text === 'string' ? body.text : '...';
    } catch {
      text = '...';
    }

    bubble.textContent = text;
    bubble.classList.add('is-visible');
    avatar.classList.add('is-talking');

    await new Promise(resolve => setTimeout(resolve, DISPLAY_DURATION_MS));

    avatar.classList.remove('is-talking');
    speaking = false;
    void processQueue();
  }

  return { react: enqueue };
}
