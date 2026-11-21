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

/**
 * Fetch a single image from a URL and return its buffer.
 */
async function fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
  if (!imageUrl) return null;
  try {
    const response = await fetch(imageUrl);
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Analyse a single album cover by URL, caching per URL hash.
 */
async function analyseSingleCover(artworkUrl: string): Promise<CoverArtTheme | null> {
  const imageBuffer = await fetchImageBuffer(artworkUrl);
  if (!imageBuffer) return null;

  // Use the URL itself as a cache key so repeated albums are cached
  const cacheKey = `cover-${Buffer.from(artworkUrl).toString('base64').slice(0, 32)}`;
  const cached = await loadCachedTheme(cacheKey);
  if (cached) return cached;

  try {
    const theme = await requestThemeFromGroq(imageBuffer);
    await saveTheme(cacheKey, theme);
    return theme;
  } catch {
    return FALLBACK_THEME;
  }
}

/**
 * Analyse multiple album covers and blend them into a single cohesive CoverArtTheme.
 * - Color schemes are blended by weighted average of RGB values
 * - Mood keywords are merged by frequency
 * - Danger level is averaged
 * - Shape style picks the most common value
 */
export async function analyseMultipleCovers(playlistId: string, artworkUrls: string[]): Promise<CoverArtTheme> {
  // Check if we already have a blended theme for this playlist
  const cached = await loadCachedTheme(playlistId);
  if (cached) return cached;

  // Deduplicate URLs
  const uniqueUrls = [...new Set(artworkUrls.filter(url => url && url.length > 0))];
  if (uniqueUrls.length === 0) return FALLBACK_THEME;

  // If only one unique cover, analyse it directly
  if (uniqueUrls.length === 1) {
    const theme = await analyseSingleCover(uniqueUrls[0]);
    if (theme) {
      await saveTheme(playlistId, theme);
    }
    return theme ?? FALLBACK_THEME;
  }

  // Analyse each unique cover in parallel
  const themes = await Promise.all(uniqueUrls.map(url => analyseSingleCover(url)));
  const validThemes = themes.filter((t): t is CoverArtTheme => t !== null);

  if (validThemes.length === 0) return FALLBACK_THEME;

  // Blend the themes
  const blended = blendThemes(validThemes);
  await saveTheme(playlistId, blended);
  return blended;
}

/**
 * Blend multiple CoverArtTheme objects into a single cohesive theme.
 */
function blendThemes(themes: CoverArtTheme[]): CoverArtTheme {
  // Blend color schemes: collect all colors, convert to RGB, average, convert back
  const allColors = themes.flatMap(t => t.colorScheme);
  if (allColors.length > 0) {
    // Pick the top 3 most frequent colors by averaging all
    const rSum = { r: 0, g: 0, b: 0, count: 0 };
    for (const hex of allColors) {
      const clean = hex.replace('#', '');
      if (clean.length === 6) {
        rSum.r += parseInt(clean.substring(0, 2), 16);
        rSum.g += parseInt(clean.substring(2, 4), 16);
        rSum.b += parseInt(clean.substring(4, 6), 16);
        rSum.count++;
      }
    }
    if (rSum.count > 0) {
      const avgR = Math.round(rSum.r / rSum.count);
      const avgG = Math.round(rSum.g / rSum.count);
      const avgB = Math.round(rSum.b / rSum.count);
      const blendedHex = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
      // Generate a palette around the average
      const blendedColors = [blendedHex];
      // Add a lighter and darker variant
      const lighterR = Math.min(255, avgR + 40);
      const lighterG = Math.min(255, avgG + 40);
      const lighterB = Math.min(255, avgB + 40);
      blendedColors.push(`#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`);
      const darkerR = Math.max(0, avgR - 40);
      const darkerG = Math.max(0, avgG - 40);
      const darkerB = Math.max(0, avgB - 40);
      blendedColors.push(`#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`);
      return {
        colorScheme: blendedColors,
        shapes: pickMostCommonShape(themes),
        overallTheme: blendOverallThemes(themes),
        dangerLevel: themes.reduce((sum, t) => sum + t.dangerLevel, 0) / themes.length,
        moodKeywords: mergeMoodKeywords(themes)
      };
    }
  }

  // Fallback: just average the numeric fields and merge keywords
  return {
    colorScheme: [],
    shapes: pickMostCommonShape(themes),
    overallTheme: blendOverallThemes(themes),
    dangerLevel: themes.reduce((sum, t) => sum + t.dangerLevel, 0) / themes.length,
    moodKeywords: mergeMoodKeywords(themes)
  };
}

function pickMostCommonShape(themes: CoverArtTheme[]): CoverArtTheme['shapes'] {
  const counts: Record<string, number> = {};
  for (const t of themes) {
    counts[t.shapes] = (counts[t.shapes] || 0) + 1;
  }
  let maxCount = 0;
  let mostCommon: CoverArtTheme['shapes'] = 'mixed';
  for (const [shape, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = shape as CoverArtTheme['shapes'];
    }
  }
  return mostCommon;
}

function blendOverallThemes(themes: CoverArtTheme[]): string {
  // Pick the theme with the highest danger level as the dominant one
  const dominant = themes.reduce((max, t) => t.dangerLevel > max.dangerLevel ? t : max, themes[0]);
  return dominant.overallTheme;
}

function mergeMoodKeywords(themes: CoverArtTheme[]): string[] {
  const frequency: Record<string, number> = {};
  for (const t of themes) {
    for (const keyword of t.moodKeywords) {
      const lower = keyword.toLowerCase();
      frequency[lower] = (frequency[lower] || 0) + 1;
    }
  }
  // Sort by frequency and take top 10
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
