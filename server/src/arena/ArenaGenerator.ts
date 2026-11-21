import sharp from 'sharp';
import { Arena, ArenaTheme, ArenaColors, ArenaObstacle } from '../../../shared/types/Arena';
import { hashString, createRandom } from '../utils/deterministicRandom';
import { analyseCoverArt, CoverArtTheme } from './CoverArtAnalyser';

async function fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function getImageStats(imageBuffer: Buffer | null): Promise<{ r: number; g: number; b: number; entropy: number }> {
  if (!imageBuffer) return { r: 80, g: 80, b: 100, entropy: 4 };

  try {
    const stats = await sharp(imageBuffer).stats();
    return { ...stats.dominant, entropy: stats.entropy };
  } catch {
    return { r: 80, g: 80, b: 100, entropy: 4 };
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) => Math.round(f(n) * 255).toString(16).padStart(2, '0');
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

function adjustLightness(hex: string, lightness: number, saturation?: number): string {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  return hslToHex(hsl.h, saturation ?? hsl.s, lightness);
}

// Falls back to a hue-based guess when the AI couldn't identify a theme
function pickTheme(h: number, s: number, l: number): ArenaTheme {
  if (l > 70 && s < 40) return ArenaTheme.Floating;
  if (s > 70 && l > 50) return ArenaTheme.Neon;
  if (h < 20 || h >= 340) return ArenaTheme.Volcanic;
  if (h < 50) return ArenaTheme.Desert;
  if (h < 150) return ArenaTheme.Forest;
  if (h < 200) return ArenaTheme.Ocean;
  if (h < 260) return ArenaTheme.Space;
  if (h < 320) return ArenaTheme.Cyberpunk;
  return ArenaTheme.Volcanic;
}

function pickThemeFromAnalysis(theme: CoverArtTheme, h: number, s: number, l: number): ArenaTheme {
  const text = `${theme.overallTheme} ${theme.moodKeywords.join(' ')}`.toLowerCase();

  if (theme.dangerLevel > 0.7 || /fire|lava|volcan|explo/.test(text)) return ArenaTheme.Volcanic;
  if (/neon|glow|electric|synth/.test(text)) return ArenaTheme.Neon;
  if (/forest|nature|leaf|green|organic/.test(text)) return ArenaTheme.Forest;
  if (/sky|cloud|float|dream|pastel/.test(text)) return ArenaTheme.Floating;
  if (/desert|sand|dust|dry/.test(text)) return ArenaTheme.Desert;
  if (/ocean|water|wave|sea/.test(text)) return ArenaTheme.Ocean;
  if (/space|galaxy|cosmic|star/.test(text)) return ArenaTheme.Space;
  if (/cyber|tech|digital|futur/.test(text)) return ArenaTheme.Cyberpunk;

  return pickTheme(h, s, l);
}

function buildColors(hue: number): ArenaColors {
  return {
    primary: hslToHex(hue, 55, 25),
    secondary: hslToHex(hue, 50, 18),
    accent: hslToHex((hue + 30) % 360, 70, 50),
    ground: hslToHex(hue, 40, 12),
    sky: hslToHex(hue, 45, 20)
  };
}

function buildColorsFromPalette(palette: string[]): ArenaColors {
  const validColors = palette.filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
  if (validColors.length === 0) return buildColors(220);

  const primary = validColors[0];
  const accent = validColors[1] ?? validColors[0];

  return {
    primary: adjustLightness(primary, 25),
    secondary: adjustLightness(primary, 18),
    accent: adjustLightness(accent, 50, 70),
    ground: adjustLightness(primary, 12),
    sky: adjustLightness(primary, 20)
  };
}

function pickObstacleType(dangerLevel: number, random: () => number): ArenaObstacle['type'] {
  const hazardWeight = 0.15 + dangerLevel * 0.5;
  const wallWeight = 0.2 + dangerLevel * 0.2;
  const boostWeight = Math.max(0.05, 0.25 - dangerLevel * 0.15);

  const roll = random();
  if (roll < hazardWeight) return 'hazard';
  if (roll < hazardWeight + wallWeight) return 'wall';
  if (roll < hazardWeight + wallWeight + boostWeight) return 'boost';
  return 'platform';
}

function buildObstacles(coverArtUrl: string, entropy: number, theme: CoverArtTheme, colors: ArenaColors, width: number, height: number): ArenaObstacle[] {
  const random = createRandom(hashString(coverArtUrl || 'default-arena'));
  const count = Math.round(Math.min(9, Math.max(3, entropy + theme.dangerLevel * 3)));
  const margin = 120;
  // sharp/angular covers get more erratic, varied obstacle sizes; round covers get calmer, uniform ones
  const sizeVariance = theme.shapes === 'sharp' ? 1.6 : theme.shapes === 'round' ? 0.6 : 1;

  const obstacles: ArenaObstacle[] = [];
  for (let i = 0; i < count; i++) {
    const obstacleWidth = 40 + random() * 100 * sizeVariance;
    const obstacleHeight = 30 + random() * 80 * sizeVariance;

    obstacles.push({
      id: `obstacle-${i}`,
      x: margin + random() * (width - margin * 2 - obstacleWidth),
      y: margin + random() * (height - margin * 2 - obstacleHeight),
      width: obstacleWidth,
      height: obstacleHeight,
      type: pickObstacleType(theme.dangerLevel, random),
      color: colors.accent
    });
  }

  return obstacles;
}

export async function generateArena(playlistId: string, coverArtUrl: string, width: number, height: number): Promise<Arena> {
  const imageBuffer = await fetchImageBuffer(coverArtUrl);
  const [theme, { r, g, b, entropy }] = await Promise.all([
    analyseCoverArt(playlistId, imageBuffer),
    getImageStats(imageBuffer)
  ]);
  const { h, s, l } = rgbToHsl(r, g, b);

  const arenaTheme = pickThemeFromAnalysis(theme, h, s, l);
  const colors = theme.colorScheme.length > 0 ? buildColorsFromPalette(theme.colorScheme) : buildColors(h);
  const obstacles = buildObstacles(coverArtUrl, entropy, theme, colors, width, height);

  return {
    id: `arena-${Date.now()}`,
    theme: arenaTheme,
    colors,
    width,
    height,
    obstacles,
    backgroundGradient: { top: colors.sky, bottom: colors.ground },
    decorations: theme.moodKeywords
  };
}
