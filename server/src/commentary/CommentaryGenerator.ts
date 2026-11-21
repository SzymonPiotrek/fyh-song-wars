import { CommentaryEvent } from '../../../shared/types/Commentary';

const SYSTEM_PROMPT = `You are the hyped-up live commentator for SONG WARS, an underground battle royale where songs fight as stickman warriors.
React to the event you're given in 1-2 short, punchy sentences, like an excited sports commentator calling a live fight.
Be vivid and fun. No hashtags, no emojis, no stage directions. Keep it under 35 words.`;

const FALLBACK_LINES: Record<CommentaryEvent['type'], string> = {
  kill: 'Oh, it is OVER! One more fighter down in the arena!',
  teamup: 'Would you look at that — these two are fighting together out there!',
  winner: 'AND THAT IS YOUR WINNER, ladies and gentlemen!'
};

function describeEvent(event: CommentaryEvent): string {
  switch (event.type) {
    case 'kill':
      return `${event.killer?.title} by ${event.killer?.artist} (${event.killer?.genre}, ${event.killer?.mood}) just eliminated ${event.victim?.title} by ${event.victim?.artist}. ` +
        `${event.killer?.title} now has ${event.kills} kill(s). ${event.aliveCount} fighters remain out of ${event.totalCount}.`;
    case 'teamup':
      return `${event.teammates?.[0].title} and ${event.teammates?.[1].title} are both ganging up on ${event.target?.title} right now!`;
    case 'winner':
      return `${event.winner?.title} by ${event.winner?.artist} is the last one standing and wins the entire battle with ${event.kills} kill(s)!`;
    default:
      return 'Something big just happened in the arena!';
  }
}

export async function generateCommentary(event: CommentaryEvent): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return FALLBACK_LINES[event.type];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: describeEvent(event) }
        ],
        temperature: 0.9,
        max_tokens: 80
      })
    });

    if (!response.ok) {
      throw new Error(`Groq request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const text = data.choices[0]?.message?.content?.trim();
    return text || FALLBACK_LINES[event.type];
  } catch {
    return FALLBACK_LINES[event.type];
  }
}
