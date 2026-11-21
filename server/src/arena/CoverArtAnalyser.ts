import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const THEMES_DIR = path.resolve('server/data/arena-themes');
const SHAPE_OPTIONS = ['sharp', 'round', 'organic', 'geometric', 'mixed'] as const;

export interface CoverArtTheme {
  colorScheme: string[]; // most prominent hex colors in the cover, in order
  shapes: typeof SHAPE_OPTIONS[number];
  overallTheme: string; // short description of the mood/theme
  dangerLevel: number; // 0 (calm/safe) to 1 (chaotic/dangerous)
  moodKeywords: string[];
}

const FALLBACK_THEME: CoverArtTheme = {
  colorScheme: [],
  shapes: 'mixed',
  overallTheme: 'unknown',
  dangerLevel: 0.5,
  moodKeywords: []
};

const PROMPT = `You are analysing an album cover to inspire the visual design of a battle arena.
Look at:
- the color scheme (the most important colors in the image)
- general shapes (sharp/angular, round/soft, organic, or geometric)
- the overall theme or mood
- any erratic, chaotic, or dangerous-looking elements (sharp jagged shapes, explosive or aggressive imagery = dangerous; soft curves and calm colors = safe)

Respond with ONLY a JSON object, no markdown or explanation, in exactly this shape:
{"colorScheme": ["#hex1", "#hex2", "#hex3"], "shapes": "sharp" | "round" | "organic" | "geometric" | "mixed", "overallTheme": "short phrase", "dangerLevel": 0.0 to 1.0, "moodKeywords": ["word1", "word2"]}`;

function themePath(playlistId: string): string {
  return path.join(THEMES_DIR, `${playlistId}.json`);
}

async function loadCachedTheme(playlistId: string): Promise<CoverArtTheme | null> {
  try {
    return JSON.parse(await readFile(themePath(playlistId), 'utf-8'));
  } catch {
    return null;
  }
}

async function saveTheme(playlistId: string, theme: CoverArtTheme): Promise<void> {
  await mkdir(THEMES_DIR, { recursive: true });
  await writeFile(themePath(playlistId), JSON.stringify(theme, null, 2));
}

function parseTheme(raw: string): CoverArtTheme {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    colorScheme: Array.isArray(parsed.colorScheme) ? parsed.colorScheme : [],
    shapes: SHAPE_OPTIONS.includes(parsed.shapes) ? parsed.shapes : 'mixed',
    overallTheme: typeof parsed.overallTheme === 'string' ? parsed.overallTheme : 'unknown',
    dangerLevel: typeof parsed.dangerLevel === 'number' ? Math.min(1, Math.max(0, parsed.dangerLevel)) : 0.5,
    moodKeywords: Array.isArray(parsed.moodKeywords) ? parsed.moodKeywords : []
  };
}

async function requestThemeFromGroq(imageBuffer: Buffer): Promise<CoverArtTheme> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return FALLBACK_THEME;

  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ],
      temperature: 0.4,
      max_tokens: 400
    })
  });

  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status}): ${await response.text()}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return parseTheme(data.choices[0].message.content);
}

export async function analyseCoverArt(playlistId: string, imageBuffer: Buffer | null): Promise<CoverArtTheme> {
  const cached = await loadCachedTheme(playlistId);
  if (cached) return cached;

  if (!imageBuffer) return FALLBACK_THEME;

  try {
    const theme = await requestThemeFromGroq(imageBuffer);
    await saveTheme(playlistId, theme);
    return theme;
  } catch {
    return FALLBACK_THEME;
  }
}
