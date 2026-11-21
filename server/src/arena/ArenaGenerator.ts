import sharp from 'sharp';
import { Arena, ArenaTheme, ArenaColors, ArenaObstacle } from '../../../shared/types/Arena';
import { hashString, createRandom, pick } from '../utils/deterministicRandom';

async function getImageStats(imageUrl: string): Promise<{ r: number; g: number; b: number; entropy: number }> {
  if (!imageUrl) return { r: 80, g: 80, b: 100, entropy: 4 };

  try {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const stats = await sharp(buffer).stats();
    return { ...stats.dominant, entropy: stats.entropy };
  } catch {
    return { r: 80, g: 80, b: 100, entropy: 4 };
  }
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

function buildColors(hue: number): ArenaColors {
  return {
    primary: hslToHex(hue, 55, 25),
    secondary: hslToHex(hue, 50, 18),
    accent: hslToHex((hue + 30) % 360, 70, 50),
    ground: hslToHex(hue, 40, 12),
    sky: hslToHex(hue, 45, 20)
  };
}

const OBSTACLE_TYPES: ArenaObstacle['type'][] = ['platform', 'wall', 'hazard', 'boost'];

function buildObstacles(coverArtUrl: string, entropy: number, colors: ArenaColors, width: number, height: number): ArenaObstacle[] {
  const random = createRandom(hashString(coverArtUrl || 'default-arena'));
  const count = Math.round(Math.min(7, Math.max(3, entropy)));
  const margin = 120;

  const obstacles: ArenaObstacle[] = [];
  for (let i = 0; i < count; i++) {
    const obstacleWidth = 50 + random() * 90;
    const obstacleHeight = 40 + random() * 70;

    obstacles.push({
      id: `obstacle-${i}`,
      x: margin + random() * (width - margin * 2 - obstacleWidth),
      y: margin + random() * (height - margin * 2 - obstacleHeight),
      width: obstacleWidth,
      height: obstacleHeight,
      type: pick(OBSTACLE_TYPES, random),
      color: colors.accent
    });
  }

  return obstacles;
}

export async function generateArena(coverArtUrl: string, width: number, height: number): Promise<Arena> {
  const { r, g, b, entropy } = await getImageStats(coverArtUrl);
  const { h, s, l } = rgbToHsl(r, g, b);
  const theme = pickTheme(h, s, l);
  const colors = buildColors(h);
  const obstacles = buildObstacles(coverArtUrl, entropy, colors, width, height);

  return {
    id: `arena-${Date.now()}`,
    theme,
    colors,
    width,
    height,
    obstacles,
    backgroundGradient: { top: colors.sky, bottom: colors.ground },
    decorations: []
  };
}
