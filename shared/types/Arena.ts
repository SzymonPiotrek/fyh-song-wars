export enum ArenaTheme {
  Volcanic = 'volcanic',
  Neon = 'neon',
  Forest = 'forest',
  Floating = 'floating',
  Desert = 'desert',
  Ocean = 'ocean',
  Space = 'space',
  Cyberpunk = 'cyberpunk'
}

export interface ArenaColors {
  primary: string;       // main background color
  secondary: string;     // secondary elements
  accent: string;        // highlights and effects
  ground: string;        // ground/floor color
  sky: string;           // sky/background gradient
}

export interface ArenaObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'platform' | 'wall' | 'hazard' | 'boost';
  color: string;
}

export interface ArenaDecoration {
  type: 'particle' | 'structure' | 'foreground' | 'background';
  config: Record<string, unknown>;
}

export interface ArenaAmbientParticles {
  color: string;
  speed: number;
  density: number;
}

export type FloorPattern = 'grid' | 'stone' | 'lava' | 'water' | 'grass' | 'neon' | 'clouds';

export interface Arena {
  id: string;
  theme: ArenaTheme;
  colors: ArenaColors;
  width: number;
  height: number;
  obstacles: ArenaObstacle[];
  backgroundGradient: {
    top: string;
    bottom: string;
  };
  decorations: ArenaDecoration[];  // structured decorations
  architecture: string;            // e.g., 'industrial', 'natural', 'futuristic', 'ancient'
  floorPattern: FloorPattern;
  ambientParticles: ArenaAmbientParticles;
  moodKeywords: string[];          // pass through for arena intro text
}
