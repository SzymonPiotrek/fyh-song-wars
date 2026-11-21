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
  decorations: string[];  // visual elements (particles, effects)
}
