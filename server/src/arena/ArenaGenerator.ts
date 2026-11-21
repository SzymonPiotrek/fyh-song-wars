import sharp from 'sharp';
import { Arena, ArenaTheme, ArenaColors, ArenaObstacle, ArenaDecoration, ArenaAmbientParticles, FloorPattern } from '../../../shared/types/Arena';
import { hashString, createRandom } from '../utils/deterministicRandom';
import { analyseCoverArt, analyseMultipleCovers, CoverArtTheme } from './CoverArtAnalyser';

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

export async function generateArena(
  playlistId: string,
  coverArtUrl: string,
  width: number,
  height: number,
  artworkUrls?: string[]
): Promise<Arena> {
  // Use multi-album analysis if multiple artwork URLs are provided
  let theme: CoverArtTheme;
  let imageBuffer: Buffer | null = null;

  if (artworkUrls && artworkUrls.length > 0) {
    theme = await analyseMultipleCovers(playlistId, artworkUrls);
    // Fetch the first cover for image stats (sharp color analysis)
    imageBuffer = await fetchImageBuffer(artworkUrls[0]);
  } else {
    imageBuffer = await fetchImageBuffer(coverArtUrl);
    theme = await analyseCoverArt(playlistId, imageBuffer);
  }

  const { r, g, b, entropy } = await getImageStats(imageBuffer);
  const { h, s, l } = rgbToHsl(r, g, b);

  const arenaTheme = pickThemeFromAnalysis(theme, h, s, l);
  const colors = theme.colorScheme.length > 0 ? buildColorsFromPalette(theme.colorScheme) : buildColors(h);
  const obstacles = buildObstacles(coverArtUrl || 'default', entropy, theme, colors, width, height);

  // Determine architecture style from theme and mood
  const architecture = determineArchitecture(arenaTheme, theme);

  // Determine floor pattern from theme
  const floorPattern = determineFloorPattern(arenaTheme);

  // Configure ambient particles from mood
  const ambientParticles = determineAmbientParticles(arenaTheme, theme, colors);

  // Generate structured decorations based on theme
  const decorations = generateDecorations(arenaTheme, theme, colors, width, height);

  return {
    id: `arena-${Date.now()}`,
    theme: arenaTheme,
    colors,
    width,
    height,
    obstacles,
    backgroundGradient: { top: colors.sky, bottom: colors.ground },
    decorations,
    architecture,
    floorPattern,
    ambientParticles,
    moodKeywords: theme.moodKeywords
  };
}

function determineArchitecture(arenaTheme: ArenaTheme, theme: CoverArtTheme): string {
  const text = `${theme.overallTheme} ${theme.moodKeywords.join(' ')}`.toLowerCase();

  if (arenaTheme === ArenaTheme.Volcanic || /fire|lava|volcan|destroy/.test(text)) return 'industrial';
  if (arenaTheme === ArenaTheme.Neon || arenaTheme === ArenaTheme.Cyberpunk || /tech|digital|futur|neon/.test(text)) return 'futuristic';
  if (arenaTheme === ArenaTheme.Forest || /nature|leaf|green|organic|forest/.test(text)) return 'natural';
  if (arenaTheme === ArenaTheme.Floating || /sky|cloud|float|dream|pastel/.test(text)) return 'ethereal';
  if (arenaTheme === ArenaTheme.Desert || /desert|sand|ancient|ruin/.test(text)) return 'ancient';
  if (arenaTheme === ArenaTheme.Ocean || /ocean|water|wave|sea/.test(text)) return 'aquatic';
  if (arenaTheme === ArenaTheme.Space || /space|galaxy|cosmic|star/.test(text)) return 'cosmic';
  return 'industrial';
}

function determineFloorPattern(arenaTheme: ArenaTheme): FloorPattern {
  switch (arenaTheme) {
    case ArenaTheme.Volcanic: return 'lava';
    case ArenaTheme.Neon: return 'neon';
    case ArenaTheme.Forest: return 'grass';
    case ArenaTheme.Floating: return 'clouds';
    case ArenaTheme.Desert: return 'stone';
    case ArenaTheme.Ocean: return 'water';
    case ArenaTheme.Space: return 'grid';
    case ArenaTheme.Cyberpunk: return 'neon';
    default: return 'grid';
  }
}

function determineAmbientParticles(arenaTheme: ArenaTheme, theme: CoverArtTheme, colors: ArenaColors): ArenaAmbientParticles {
  const dangerLevel = theme.dangerLevel;
  const speed = 0.5 + dangerLevel * 2;
  const density = 0.3 + dangerLevel * 0.7;

  switch (arenaTheme) {
    case ArenaTheme.Volcanic:
      return { color: '#ff4400', speed, density };
    case ArenaTheme.Neon:
      return { color: colors.accent, speed: speed * 0.8, density };
    case ArenaTheme.Forest:
      return { color: '#44aa22', speed: speed * 0.5, density: density * 0.7 };
    case ArenaTheme.Floating:
      return { color: '#ffffff', speed: speed * 0.3, density: density * 0.5 };
    case ArenaTheme.Desert:
      return { color: '#ddaa44', speed: speed * 0.6, density };
    case ArenaTheme.Ocean:
      return { color: '#44aaff', speed: speed * 0.4, density: density * 0.6 };
    case ArenaTheme.Space:
      return { color: '#ffffff', speed: speed * 0.2, density: density * 0.8 };
    case ArenaTheme.Cyberpunk:
      return { color: '#ff00ff', speed: speed * 0.9, density };
    default:
      return { color: colors.accent, speed, density };
  }
}

function generateDecorations(arenaTheme: ArenaTheme, theme: CoverArtTheme, colors: ArenaColors, width: number, height: number): ArenaDecoration[] {
  const random = createRandom(hashString(arenaTheme + width + height));
  const decorations: ArenaDecoration[] = [];

  const margin = 100;

  switch (arenaTheme) {
    case ArenaTheme.Volcanic:
      // Lava pools
      for (let i = 0; i < 3; i++) {
        decorations.push({
          type: 'foreground',
          config: {
            kind: 'lavaPool',
            x: margin + random() * (width - margin * 2),
            y: margin + random() * (height - margin * 2),
            radius: 30 + random() * 50,
            color: '#ff4400'
          }
        });
      }
      // Smoke particles
      decorations.push({
        type: 'particle',
        config: { kind: 'smoke', count: 15, color: '#664422', riseSpeed: 0.5 }
      });
      // Rock formations
      for (let i = 0; i < 4; i++) {
        decorations.push({
          type: 'background',
          config: {
            kind: 'rockFormation',
            x: margin + random() * (width - margin * 2),
            y: margin + random() * (height * 0.4),
            size: 40 + random() * 60
          }
        });
      }
      break;

    case ArenaTheme.Neon:
      // Neon pillars
      for (let i = 0; i < 5; i++) {
        decorations.push({
          type: 'structure',
          config: {
            kind: 'neonPillar',
            x: margin + random() * (width - margin * 2),
            y: margin + random() * (height - margin * 2),
            height: 80 + random() * 120,
            color: colors.accent
          }
        });
      }
      // Holographic rings
      for (let i = 0; i < 3; i++) {
        decorations.push({
          type: 'foreground',
          config: {
            kind: 'holoRing',
            x: width / 2 + (random() - 0.5) * width * 0.6,
            y: height / 2 + (random() - 0.5) * height * 0.4,
            radius: 40 + random() * 30,
            color: colors.accent
          }
        });
      }
      break;

    case ArenaTheme.Forest:
      // Tree silhouettes
      for (let i = 0; i < 6; i++) {
        decorations.push({
          type: 'background',
          config: {
            kind: 'tree',
            x: margin + random() * (width - margin * 2),
            y: height - 50 - random() * 100,
            height: 80 + random() * 120,
            color: '#225522'
          }
        });
      }
      // Leaf particles
      decorations.push({
        type: 'particle',
        config: { kind: 'leaves', count: 20, color: '#44aa22', driftSpeed: 0.3 }
      });
      // Mossy ground patches
      for (let i = 0; i < 4; i++) {
        decorations.push({
          type: 'foreground',
          config: {
            kind: 'mossPatch',
            x: margin + random() * (width - margin * 2),
            y: margin + random() * (height - margin * 2),
            radius: 20 + random() * 30
          }
        });
      }
      break;

    case ArenaTheme.Floating:
      // Cloud layers
      for (let i = 0; i < 5; i++) {
        decorations.push({
          type: 'background',
          config: {
            kind: 'cloud',
            x: random() * width,
            y: random() * height * 0.5,
            width: 100 + random() * 150,
            height: 40 + random() * 60,
            opacity: 0.2 + random() * 0.3
          }
        });
      }
      // Floating platforms
      for (let i = 0; i < 3; i++) {
        decorations.push({
          type: 'structure',
          config: {
            kind: 'floatingPlatform',
            x: margin + random() * (width - margin * 2),
            y: margin + random() * (height - margin * 2),
            width: 60 + random() * 80,
            height: 15
          }
        });
      }
      // Light rays
      decorations.push({
        type: 'foreground',
        config: { kind: 'lightRays', count: 4, color: '#ffffff', opacity: 0.1 }
      });
      break;

    case ArenaTheme.Desert:
      // Sand dunes
      for (let i = 0; i < 4; i++) {
        decorations.push({
          type: 'background',
          config: {
            kind: 'sandDune',
            x: random() * width,
            y: height * 0.3 + random() * height * 0.4,
            width: 150 + random() * 200,
            height: 40 + random() * 60
          }
        });
      }
      // Rock pillars
      for (let i = 0; i < 3; i++) {
        decorations.push({
          type: 'structure',
          config: {
            kind: 'rockPillar',
            x: margin + random() * (width - margin * 2),
            y: height - 100 - random() * 80,
            height: 60 + random() * 100,
            width: 20 + random() * 30
          }
        });
      }
      // Heat shimmer particles
      decorations.push({
        type: 'particle',
        config: { kind: 'heatShimmer', count: 10, color: '#ffaa44', riseSpeed: 0.8 }
      });
      break;

    case ArenaTheme.Ocean:
      // Wave patterns
      for (let i = 0; i < 4; i++) {
        decorations.push({
          type: 'foreground',
          config: {
            kind: 'wave',
            x: random() * width,
            y: height * 0.5 + random() * height * 0.4,
            amplitude: 10 + random() * 15,
            wavelength: 80 + random() * 120
          }
        });
      }
      // Bubble particles
      decorations.push({
        type: 'particle',
        config: { kind: 'bubbles', count: 15, color: '#88ccff', riseSpeed: 1.0 }
      });
      // Water reflections
      decorations.push({
        type: 'foreground',
        config: { kind: 'waterReflection', color: '#4488cc', opacity: 0.15 }
      });
      break;

    case ArenaTheme.Space:
      // Starfield
      decorations.push({
        type: 'background',
        config: { kind: 'starfield', count: 100, color: '#ffffff' }
      });
      // Nebula clouds
      for (let i = 0; i < 3; i++) {
        decorations.push({
          type: 'background',
          config: {
            kind: 'nebula',
            x: random() * width,
            y: random() * height,
            radius: 80 + random() * 120,
            color: colors.accent,
            opacity: 0.1 + random() * 0.15
          }
        });
      }
      // Asteroid decorations
      for (let i = 0; i < 4; i++) {
        decorations.push({
          type: 'foreground',
          config: {
            kind: 'asteroid',
            x: margin + random() * (width - margin * 2),
            y: margin + random() * (height - margin * 2),
            size: 10 + random() * 20
          }
        });
      }
      break;

    case ArenaTheme.Cyberpunk:
      // Neon signs
      for (let i = 0; i < 4; i++) {
        decorations.push({
          type: 'structure',
          config: {
            kind: 'neonSign',
            x: margin + random() * (width - margin * 2),
            y: margin + random() * (height * 0.5),
            width: 40 + random() * 60,
            height: 20 + random() * 30,
            color: ['#ff00ff', '#00ffff', '#ff4444', '#44ff44'][Math.floor(random() * 4)]
          }
        });
      }
      // Digital rain
      decorations.push({
        type: 'particle',
        config: { kind: 'digitalRain', count: 20, color: '#00ff00', fallSpeed: 1.5 }
      });
      // Metal structures
      for (let i = 0; i < 3; i++) {
        decorations.push({
          type: 'background',
          config: {
            kind: 'metalStructure',
            x: margin + random() * (width - margin * 2),
            y: height - 80 - random() * 60,
            width: 50 + random() * 80,
            height: 60 + random() * 80
          }
        });
      }
      // Holograms
      for (let i = 0; i < 2; i++) {
        decorations.push({
          type: 'foreground',
          config: {
            kind: 'hologram',
            x: width / 2 + (random() - 0.5) * width * 0.5,
            y: height / 2 + (random() - 0.5) * height * 0.3,
            radius: 30 + random() * 20,
            color: '#00ffff'
          }
        });
      }
      break;
  }

  return decorations;
}
