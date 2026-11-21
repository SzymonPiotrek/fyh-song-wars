import * as PIXI from 'pixi.js';
import { Arena, ArenaTheme } from '../../../../shared/types/Arena';

const { Container, Graphics, Text } = PIXI;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class ArenaScene {
  private container: PIXI.Container;
  private chuteContainer: PIXI.Container | null = null;
  private chuteOpen: boolean = false;
  private chuteTimer: number = 0;
  private particles: Particle[] = [];
  private particleGraphics: PIXI.Graphics | null = null;
  private time: number = 0;

  constructor(stage: PIXI.Container) {
    this.container = new Container();
    stage.addChild(this.container);
  }

  render(arena: Arena, showChute: boolean = false, entrancePhase: boolean = false) {
    this.container.removeChildren();
    this.time += 0.016; // ~60fps increment

    // Background gradient
    this.drawBackground(arena);

    // Theme-specific rendering
    this.drawThemeArena(arena);

    // Floor pattern
    this.drawFloorPattern(arena);

    // Decorations
    this.drawDecorations(arena);

    // Ambient particles
    this.drawAmbientParticles(arena);

    // Obstacles
    this.drawObstacles(arena);

    // Border
    this.drawBorder(arena);

    // Draw chute during entrance phase
    if (entrancePhase) {
      this.drawChute(arena);
    }
  }

  private drawBackground(arena: Arena) {
    const bg = new Graphics();
    const topColor = parseInt(arena.backgroundGradient.top.replace('#', ''), 16);
    const bottomColor = parseInt(arena.backgroundGradient.bottom.replace('#', ''), 16);

    // Simple gradient approximation using layered rectangles
    const steps = 10;
    const stepHeight = arena.height / steps;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(((topColor >> 16) & 0xff) * (1 - t) + ((bottomColor >> 16) & 0xff) * t);
      const g = Math.round(((topColor >> 8) & 0xff) * (1 - t) + ((bottomColor >> 8) & 0xff) * t);
      const b = Math.round((topColor & 0xff) * (1 - t) + (bottomColor & 0xff) * t);
      const color = (r << 16) | (g << 8) | b;
      bg.beginFill(color);
      bg.drawRect(0, i * stepHeight, arena.width, stepHeight + 1);
      bg.endFill();
    }
    this.container.addChild(bg);
  }

  private drawThemeArena(arena: Arena) {
    switch (arena.theme) {
      case ArenaTheme.Volcanic:
        this.drawVolcanicArena(arena);
        break;
      case ArenaTheme.Neon:
        this.drawNeonArena(arena);
        break;
      case ArenaTheme.Forest:
        this.drawForestArena(arena);
        break;
      case ArenaTheme.Floating:
        this.drawFloatingArena(arena);
        break;
      case ArenaTheme.Desert:
        this.drawDesertArena(arena);
        break;
      case ArenaTheme.Ocean:
        this.drawOceanArena(arena);
        break;
      case ArenaTheme.Space:
        this.drawSpaceArena(arena);
        break;
      case ArenaTheme.Cyberpunk:
        this.drawCyberpunkArena(arena);
        break;
    }
  }

  private drawVolcanicArena(arena: Arena) {
    const g = new Graphics();

    // Dark rocky background texture
    g.beginFill(0x1a0a00, 0.5);
    g.drawRect(0, 0, arena.width, arena.height);
    g.endFill();

    // Lava glow at bottom
    const lavaGlow = new Graphics();
    lavaGlow.beginFill(0xff4400, 0.15 + Math.sin(this.time * 2) * 0.05);
    lavaGlow.drawRect(0, arena.height - 150, arena.width, 150);
    lavaGlow.endFill();
    this.container.addChild(lavaGlow);

    // Rock formations in background
    for (let i = 0; i < 6; i++) {
      const seed = i * 137;
      const rx = (seed * 7) % arena.width;
      const ry = arena.height - 50 - (seed * 13) % 200;
      const rs = 30 + (seed * 17) % 60;
      const rock = new Graphics();
      rock.beginFill(0x2a1a0a);
      rock.moveTo(rx, ry);
      rock.lineTo(rx - rs / 2, ry + rs);
      rock.lineTo(rx + rs / 2, ry + rs);
      rock.closePath();
      rock.endFill();
      this.container.addChild(rock);
    }

    this.container.addChild(g);
  }

  private drawNeonArena(arena: Arena) {
    const accentColor = parseInt(arena.colors.accent.replace('#', ''), 16);

    // Neon grid lines (perspective effect)
    const grid = new Graphics();
    grid.lineStyle(1, accentColor, 0.15);

    // Horizontal lines with perspective
    for (let i = 0; i < 20; i++) {
      const y = (i / 20) * arena.height;
      const spread = i / 20;
      grid.moveTo(0, y);
      grid.lineTo(arena.width, y);
    }

    // Vertical lines
    for (let i = 0; i < 15; i++) {
      const x = (i / 15) * arena.width;
      grid.moveTo(x, 0);
      grid.lineTo(x, arena.height);
    }
    this.container.addChild(grid);

    // Glowing neon pillars
    for (let i = 0; i < 4; i++) {
      const px = 100 + i * (arena.width - 200) / 3;
      const pillar = new Graphics();
      const pulse = 0.3 + Math.sin(this.time * 3 + i) * 0.15;
      pillar.beginFill(accentColor, pulse);
      pillar.drawRect(px - 3, 0, 6, arena.height);
      pillar.endFill();
      this.container.addChild(pillar);
    }
  }

  private drawForestArena(arena: Arena) {
    // Dark green overlay
    const overlay = new Graphics();
    overlay.beginFill(0x0a1a0a, 0.3);
    overlay.drawRect(0, 0, arena.width, arena.height);
    overlay.endFill();
    this.container.addChild(overlay);

    // Tree silhouettes in background
    for (let i = 0; i < 8; i++) {
      const seed = i * 97 + 42;
      const tx = (seed * 11) % arena.width;
      const th = 100 + (seed * 23) % 150;
      const ty = arena.height - 30;
      const tree = new Graphics();
      tree.beginFill(0x0a2a0a, 0.6);
      // Trunk
      tree.drawRect(tx - 5, ty - th * 0.4, 10, th * 0.4);
      // Canopy (triangle)
      tree.moveTo(tx, ty - th);
      tree.lineTo(tx - 25 - (i % 3) * 10, ty - th * 0.3);
      tree.lineTo(tx + 25 + (i % 3) * 10, ty - th * 0.3);
      tree.closePath();
      tree.endFill();
      this.container.addChild(tree);
    }

    // Ground moss
    const moss = new Graphics();
    moss.beginFill(0x1a3a1a, 0.4);
    moss.drawRect(0, arena.height - 40, arena.width, 40);
    moss.endFill();
    this.container.addChild(moss);
  }

  private drawFloatingArena(arena: Arena) {
    // Sky gradient overlay
    const sky = new Graphics();
    sky.beginFill(0x88aacc, 0.1);
    sky.drawRect(0, 0, arena.width, arena.height);
    sky.endFill();
    this.container.addChild(sky);

    // Cloud layers
    for (let i = 0; i < 6; i++) {
      const seed = i * 73 + 17;
      const cx = ((seed * 31 + this.time * 10 * (i % 2 === 0 ? 1 : -1)) % (arena.width + 200)) - 100;
      const cy = 50 + (seed * 19) % (arena.height * 0.5);
      const cw = 80 + (seed * 13) % 120;
      const ch = 30 + (seed * 7) % 40;
      const cloud = new Graphics();
      const opacity = 0.15 + (i % 3) * 0.08;
      cloud.beginFill(0xffffff, opacity);
      cloud.drawCircle(cx, cy, ch);
      cloud.drawCircle(cx - cw * 0.3, cy + 5, ch * 0.8);
      cloud.drawCircle(cx + cw * 0.3, cy + 5, ch * 0.8);
      cloud.drawCircle(cx + cw * 0.15, cy - 5, ch * 0.7);
      cloud.endFill();
      this.container.addChild(cloud);
    }

    // Light rays from top
    const rays = new Graphics();
    for (let i = 0; i < 5; i++) {
      const rx = arena.width * 0.2 + i * arena.width * 0.15;
      const pulse = 0.03 + Math.sin(this.time * 1.5 + i * 0.8) * 0.02;
      rays.beginFill(0xffffff, pulse);
      rays.moveTo(rx - 15, 0);
      rays.lineTo(rx + 15, 0);
      rays.lineTo(rx + 40, arena.height);
      rays.lineTo(rx - 40, arena.height);
      rays.closePath();
      rays.endFill();
    }
    this.container.addChild(rays);
  }

  private drawDesertArena(arena: Arena) {
    // Warm sand overlay
    const sand = new Graphics();
    sand.beginFill(0x2a1a0a, 0.3);
    sand.drawRect(0, 0, arena.width, arena.height);
    sand.endFill();
    this.container.addChild(sand);

    // Sand dunes in background
    for (let i = 0; i < 4; i++) {
      const dune = new Graphics();
      const dy = arena.height * 0.4 + i * 60;
      dune.beginFill(0x3a2a1a, 0.4);
      dune.moveTo(0, dy);
      for (let x = 0; x <= arena.width; x += 20) {
        const y = dy + Math.sin(x * 0.005 + i * 2) * 30 + Math.sin(x * 0.01 + i) * 15;
        dune.lineTo(x, y);
      }
      dune.lineTo(arena.width, arena.height);
      dune.lineTo(0, arena.height);
      dune.closePath();
      dune.endFill();
      this.container.addChild(dune);
    }

    // Heat shimmer effect
    const shimmer = new Graphics();
    shimmer.beginFill(0xffaa44, 0.03 + Math.sin(this.time * 3) * 0.02);
    shimmer.drawRect(0, 0, arena.width, arena.height);
    shimmer.endFill();
    this.container.addChild(shimmer);
  }

  private drawOceanArena(arena: Arena) {
    // Deep blue overlay
    const deep = new Graphics();
    deep.beginFill(0x0a1a2a, 0.4);
    deep.drawRect(0, 0, arena.width, arena.height);
    deep.endFill();
    this.container.addChild(deep);

    // Wave patterns
    for (let w = 0; w < 5; w++) {
      const wave = new Graphics();
      const wy = arena.height * 0.3 + w * 80;
      wave.lineStyle(2, 0x2266aa, 0.2);
      wave.moveTo(0, wy);
      for (let x = 0; x <= arena.width; x += 5) {
        const y = wy + Math.sin(x * 0.02 + this.time * 2 + w) * 15 + Math.sin(x * 0.01 + this.time * 1.5) * 10;
        wave.lineTo(x, y);
      }
      wave.endFill();
      this.container.addChild(wave);
    }

    // Light caustics on floor
    const caustics = new Graphics();
    for (let i = 0; i < 8; i++) {
      const seed = i * 53;
      const cx = (seed * 17 + this.time * 20) % arena.width;
      const cy = arena.height - 100 - (seed * 11) % 100;
      const pulse = 0.05 + Math.sin(this.time * 2 + i) * 0.03;
      caustics.beginFill(0x44aaff, pulse);
      caustics.drawCircle(cx, cy, 20 + Math.sin(this.time + i) * 10);
      caustics.endFill();
    }
    this.container.addChild(caustics);
  }

  private drawSpaceArena(arena: Arena) {
    // Deep space background
    const space = new Graphics();
    space.beginFill(0x050510, 0.6);
    space.drawRect(0, 0, arena.width, arena.height);
    space.endFill();
    this.container.addChild(space);

    // Starfield
    const stars = new Graphics();
    stars.beginFill(0xffffff);
    for (let i = 0; i < 150; i++) {
      const seed = i * 31 + 7;
      const sx = (seed * 13) % arena.width;
      const sy = (seed * 17) % arena.height;
      const ss = 0.5 + (seed % 3) * 0.5;
      const twinkle = 0.3 + Math.sin(this.time * 3 + seed) * 0.3;
      stars.alpha = twinkle;
      stars.drawCircle(sx, sy, ss);
    }
    stars.endFill();
    this.container.addChild(stars);

    // Nebula clouds
    const accentColor = parseInt(arena.colors.accent.replace('#', ''), 16);
    for (let i = 0; i < 3; i++) {
      const seed = i * 89 + 47;
      const nx = (seed * 23) % arena.width;
      const ny = (seed * 31) % arena.height;
      const nr = 80 + (seed * 7) % 100;
      const nebula = new Graphics();
      nebula.beginFill(accentColor, 0.05 + Math.sin(this.time + i) * 0.02);
      nebula.drawCircle(nx, ny, nr);
      nebula.endFill();
      this.container.addChild(nebula);
    }
  }

  private drawCyberpunkArena(arena: Arena) {
    const accentColor = parseInt(arena.colors.accent.replace('#', ''), 16);

    // Dark tech overlay
    const tech = new Graphics();
    tech.beginFill(0x0a0a1a, 0.4);
    tech.drawRect(0, 0, arena.width, arena.height);
    tech.endFill();
    this.container.addChild(tech);

    // Digital rain (falling characters effect)
    const rain = new Graphics();
    rain.beginFill(0x00ff00, 0.15);
    for (let i = 0; i < 30; i++) {
      const seed = i * 41;
      const rx = (seed * 19) % arena.width;
      const ry = ((seed * 23 + this.time * 100) % arena.height);
      rain.drawRect(rx, ry, 2, 8);
    }
    rain.endFill();
    this.container.addChild(rain);

    // Neon signs
    const neonColors = [0xff00ff, 0x00ffff, 0xff4444, 0x44ff44];
    for (let i = 0; i < 4; i++) {
      const seed = i * 67 + 13;
      const nx = 50 + (seed * 31) % (arena.width - 100);
      const ny = 30 + (seed * 17) % (arena.height * 0.4);
      const nw = 40 + (seed * 11) % 60;
      const nh = 15 + (seed * 7) % 25;
      const pulse = 0.4 + Math.sin(this.time * 4 + i * 1.5) * 0.2;
      const sign = new Graphics();
      const nc = neonColors[i % neonColors.length];
      sign.beginFill(nc, pulse);
      sign.drawRoundedRect(nx, ny, nw, nh, 3);
      sign.endFill();
      sign.lineStyle(1, nc, pulse + 0.2);
      sign.drawRoundedRect(nx, ny, nw, nh, 3);
      this.container.addChild(sign);
    }

    // Metal grid structures
    const metal = new Graphics();
    metal.lineStyle(1, accentColor, 0.1);
    for (let i = 0; i < 10; i++) {
      const mx = i * (arena.width / 10);
      metal.moveTo(mx, 0);
      metal.lineTo(mx, arena.height);
    }
    for (let i = 0; i < 8; i++) {
      const my = i * (arena.height / 8);
      metal.moveTo(0, my);
      metal.lineTo(arena.width, my);
    }
    this.container.addChild(metal);
  }

  private drawFloorPattern(arena: Arena) {
    const pattern = arena.floorPattern;
    const g = new Graphics();

    switch (pattern) {
      case 'grid':
        this.drawGridPattern(g, arena);
        break;
      case 'stone':
        this.drawStonePattern(g, arena);
        break;
      case 'lava':
        this.drawLavaPattern(g, arena);
        break;
      case 'water':
        this.drawWaterPattern(g, arena);
        break;
      case 'grass':
        this.drawGrassPattern(g, arena);
        break;
      case 'neon':
        this.drawNeonFloorPattern(g, arena);
        break;
      case 'clouds':
        this.drawCloudsFloorPattern(g, arena);
        break;
    }

    this.container.addChild(g);
  }

  private drawGridPattern(g: PIXI.Graphics, arena: Arena) {
    const gridSize = 50;
    const gridColor = parseInt(arena.colors.secondary.replace('#', ''), 16);
    g.lineStyle(1, gridColor, 0.2);
    for (let x = 0; x <= arena.width; x += gridSize) {
      g.moveTo(x, 0);
      g.lineTo(x, arena.height);
    }
    for (let y = 0; y <= arena.height; y += gridSize) {
      g.moveTo(0, y);
      g.lineTo(arena.width, y);
    }
  }

  private drawStonePattern(g: PIXI.Graphics, arena: Arena) {
    const stoneColor = parseInt(arena.colors.ground.replace('#', ''), 16);
    g.lineStyle(1, stoneColor, 0.3);
    const tileSize = 40;
    for (let x = 0; x < arena.width; x += tileSize) {
      for (let y = 0; y < arena.height; y += tileSize) {
        const offset = ((x / tileSize) % 2) * (tileSize / 2);
        g.drawRect(x + offset, y, tileSize, tileSize);
      }
    }
  }

  private drawLavaPattern(g: PIXI.Graphics, arena: Arena) {
    // Glowing lava cracks
    g.lineStyle(2, 0xff4400, 0.3 + Math.sin(this.time * 2) * 0.1);
    for (let i = 0; i < 8; i++) {
      const seed = i * 53 + 17;
      let lx = (seed * 11) % arena.width;
      let ly = (seed * 13) % arena.height;
      g.moveTo(lx, ly);
      for (let j = 0; j < 5; j++) {
        lx += (Math.sin(seed + j) * 30);
        ly += (Math.cos(seed + j) * 30);
        g.lineTo(lx, ly);
      }
    }
    // Lava glow spots
    for (let i = 0; i < 5; i++) {
      const seed = i * 71 + 29;
      const lx = (seed * 17) % arena.width;
      const ly = (seed * 19) % arena.height;
      const pulse = 0.1 + Math.sin(this.time * 3 + i) * 0.05;
      g.beginFill(0xff4400, pulse);
      g.drawCircle(lx, ly, 15 + Math.sin(this.time * 2 + i) * 5);
      g.endFill();
    }
  }

  private drawWaterPattern(g: PIXI.Graphics, arena: Arena) {
    // Ripple effect
    g.lineStyle(1, 0x4488cc, 0.15);
    for (let i = 0; i < 6; i++) {
      const seed = i * 47;
      const cx = (seed * 13) % arena.width;
      const cy = (seed * 17) % arena.height;
      const radius = 20 + (this.time * 20 + i * 30) % 60;
      g.drawCircle(cx, cy, radius);
    }
  }

  private drawGrassPattern(g: PIXI.Graphics, arena: Arena) {
    // Grass blades
    g.lineStyle(1, 0x2a5a2a, 0.3);
    for (let i = 0; i < 60; i++) {
      const seed = i * 37 + 11;
      const gx = (seed * 13) % arena.width;
      const gy = (seed * 17) % arena.height;
      const sway = Math.sin(this.time * 2 + seed) * 3;
      g.moveTo(gx, gy);
      g.lineTo(gx + sway, gy - 8 - (seed % 5));
    }
  }

  private drawNeonFloorPattern(g: PIXI.Graphics, arena: Arena) {
    const accentColor = parseInt(arena.colors.accent.replace('#', ''), 16);
    const gridSize = 60;
    g.lineStyle(1, accentColor, 0.2 + Math.sin(this.time * 2) * 0.1);
    for (let x = 0; x <= arena.width; x += gridSize) {
      g.moveTo(x, 0);
      g.lineTo(x, arena.height);
    }
    for (let y = 0; y <= arena.height; y += gridSize) {
      g.moveTo(0, y);
      g.lineTo(arena.width, y);
    }
    // Glowing intersection points
    for (let x = 0; x <= arena.width; x += gridSize) {
      for (let y = 0; y <= arena.height; y += gridSize) {
        const pulse = 0.3 + Math.sin(this.time * 3 + x * 0.01 + y * 0.01) * 0.2;
        g.beginFill(accentColor, pulse);
        g.drawCircle(x, y, 2);
        g.endFill();
      }
    }
  }

  private drawCloudsFloorPattern(g: PIXI.Graphics, arena: Arena) {
    // Soft cloud-like floor
    for (let i = 0; i < 10; i++) {
      const seed = i * 61 + 23;
      const cx = (seed * 17 + this.time * 5) % arena.width;
      const cy = (seed * 19) % arena.height;
      const cr = 30 + (seed * 7) % 40;
      g.beginFill(0xffffff, 0.05);
      g.drawCircle(cx, cy, cr);
      g.endFill();
    }
  }

  private drawDecorations(arena: Arena) {
    for (const decoration of arena.decorations) {
      const config = decoration.config as Record<string, unknown>;
      const kind = config.kind as string;

      switch (decoration.type) {
        case 'background':
          this.drawBackgroundDecoration(kind, config, arena);
          break;
        case 'structure':
          this.drawStructureDecoration(kind, config);
          break;
        case 'foreground':
          this.drawForegroundDecoration(kind, config);
          break;
        case 'particle':
          // Particles are handled by drawAmbientParticles
          break;
      }
    }
  }

  private drawBackgroundDecoration(kind: string, config: Record<string, unknown>, arena: Arena) {
    const g = new Graphics();
    const x = config.x as number ?? 0;
    const y = config.y as number ?? 0;

    switch (kind) {
      case 'rockFormation': {
        const size = config.size as number ?? 50;
        g.beginFill(0x2a1a0a, 0.5);
        g.moveTo(x, y - size);
        g.lineTo(x - size * 0.6, y + size * 0.3);
        g.lineTo(x + size * 0.6, y + size * 0.3);
        g.closePath();
        g.endFill();
        break;
      }
      case 'tree': {
        const height = config.height as number ?? 100;
        const color = config.color as string ?? '#225522';
        const c = parseInt(color.replace('#', ''), 16);
        g.beginFill(c, 0.5);
        g.drawRect(x - 4, y - height * 0.4, 8, height * 0.4);
        g.moveTo(x, y - height);
        g.lineTo(x - 20, y - height * 0.3);
        g.lineTo(x + 20, y - height * 0.3);
        g.closePath();
        g.endFill();
        break;
      }
      case 'cloud': {
        const w = config.width as number ?? 100;
        const h = config.height as number ?? 40;
        const opacity = config.opacity as number ?? 0.2;
        g.beginFill(0xffffff, opacity);
        g.drawCircle(x, y, h * 0.6);
        g.drawCircle(x - w * 0.25, y + 3, h * 0.5);
        g.drawCircle(x + w * 0.25, y + 3, h * 0.5);
        g.endFill();
        break;
      }
      case 'sandDune': {
        const w = config.width as number ?? 150;
        const h = config.height as number ?? 40;
        g.beginFill(0x3a2a1a, 0.3);
        g.moveTo(x - w / 2, y + h / 2);
        g.quadraticCurveTo(x, y - h / 2, x + w / 2, y + h / 2);
        g.closePath();
        g.endFill();
        break;
      }
      case 'starfield': {
        const count = config.count as number ?? 100;
        g.beginFill(0xffffff);
        for (let i = 0; i < count; i++) {
          const sx = (i * 31 + 7) % arena.width;
          const sy = (i * 17 + 13) % arena.height;
          const ss = 0.5 + (i % 3) * 0.3;
          const twinkle = 0.3 + Math.sin(this.time * 3 + i) * 0.3;
          g.alpha = twinkle;
          g.drawCircle(sx, sy, ss);
        }
        g.endFill();
        break;
      }
      case 'nebula': {
        const radius = config.radius as number ?? 100;
        const color = config.color as string ?? '#aa3bff';
        const opacity = config.opacity as number ?? 0.1;
        const c = parseInt(color.replace('#', ''), 16);
        g.beginFill(c, opacity);
        g.drawCircle(x, y, radius);
        g.endFill();
        break;
      }
      case 'metalStructure': {
        const w = config.width as number ?? 60;
        const h = config.height as number ?? 80;
        g.beginFill(0x333355, 0.4);
        g.drawRect(x, y - h, w, h);
        g.lineStyle(1, 0x555577, 0.3);
        g.drawRect(x, y - h, w, h);
        break;
      }
    }

    this.container.addChild(g);
  }

  private drawStructureDecoration(kind: string, config: Record<string, unknown>) {
    const g = new Graphics();
    const x = config.x as number ?? 0;
    const y = config.y as number ?? 0;

    switch (kind) {
      case 'neonPillar': {
        const height = config.height as number ?? 100;
        const color = config.color as string ?? '#aa3bff';
        const c = parseInt(color.replace('#', ''), 16);
        const pulse = 0.3 + Math.sin(this.time * 3) * 0.15;
        g.beginFill(c, pulse);
        g.drawRect(x - 3, y - height, 6, height);
        g.endFill();
        break;
      }
      case 'floatingPlatform': {
        const w = config.width as number ?? 60;
        const h = config.height as number ?? 15;
        g.beginFill(0x8888aa, 0.3);
        g.lineStyle(1, 0xaaAACC, 0.4);
        g.drawRoundedRect(x - w / 2, y - h / 2, w, h, 4);
        break;
      }
      case 'rockPillar': {
        const height = config.height as number ?? 80;
        const w = config.width as number ?? 25;
        g.beginFill(0x3a2a1a, 0.5);
        g.moveTo(x - w / 2, y);
        g.lineTo(x - w / 4, y - height);
        g.lineTo(x + w / 4, y - height);
        g.lineTo(x + w / 2, y);
        g.closePath();
        g.endFill();
        break;
      }
      case 'neonSign': {
        const w = config.width as number ?? 50;
        const h = config.height as number ?? 20;
        const color = config.color as string ?? '#ff00ff';
        const c = parseInt(color.replace('#', ''), 16);
        const pulse = 0.4 + Math.sin(this.time * 4) * 0.2;
        g.beginFill(c, pulse);
        g.drawRoundedRect(x, y, w, h, 3);
        g.endFill();
        g.lineStyle(1, c, pulse + 0.2);
        g.drawRoundedRect(x, y, w, h, 3);
        break;
      }
    }

    this.container.addChild(g);
  }

  private drawForegroundDecoration(kind: string, config: Record<string, unknown>) {
    const g = new Graphics();
    const x = config.x as number ?? 0;
    const y = config.y as number ?? 0;

    switch (kind) {
      case 'lavaPool': {
        const radius = config.radius as number ?? 40;
        const pulse = 0.2 + Math.sin(this.time * 2) * 0.1;
        g.beginFill(0xff4400, pulse);
        g.drawCircle(x, y, radius);
        g.endFill();
        // Inner glow
        g.beginFill(0xffaa00, pulse * 0.5);
        g.drawCircle(x, y, radius * 0.5);
        g.endFill();
        break;
      }
      case 'holoRing': {
        const radius = config.radius as number ?? 40;
        const color = config.color as string ?? '#aa3bff';
        const c = parseInt(color.replace('#', ''), 16);
        const pulse = 0.2 + Math.sin(this.time * 2) * 0.1;
        g.lineStyle(2, c, pulse);
        g.drawCircle(x, y, radius);
        break;
      }
      case 'mossPatch': {
        const radius = config.radius as number ?? 25;
        g.beginFill(0x2a5a2a, 0.3);
        g.drawCircle(x, y, radius);
        g.endFill();
        break;
      }
      case 'lightRays': {
        const count = config.count as number ?? 4;
        const color = config.color as string ?? '#ffffff';
        const opacity = config.opacity as number ?? 0.1;
        const c = parseInt(color.replace('#', ''), 16);
        for (let i = 0; i < count; i++) {
          const rx = x + (i - count / 2) * 80;
          const pulse = opacity + Math.sin(this.time * 1.5 + i * 0.8) * 0.03;
          g.beginFill(c, pulse);
          g.moveTo(rx - 10, y - 200);
          g.lineTo(rx + 10, y - 200);
          g.lineTo(rx + 30, y + 200);
          g.lineTo(rx - 30, y + 200);
          g.closePath();
          g.endFill();
        }
        break;
      }
      case 'wave': {
        const amplitude = config.amplitude as number ?? 10;
        const wavelength = config.wavelength as number ?? 80;
        g.lineStyle(2, 0x4488cc, 0.2);
        g.moveTo(x - 100, y);
        for (let dx = -100; dx <= 100; dx += 5) {
          const wy = y + Math.sin((dx + this.time * 50) / wavelength * Math.PI * 2) * amplitude;
          g.lineTo(x + dx, wy);
        }
        break;
      }
      case 'waterReflection': {
        const color = config.color as string ?? '#4488cc';
        const opacity = config.opacity as number ?? 0.15;
        const c = parseInt(color.replace('#', ''), 16);
        g.beginFill(c, opacity);
        g.drawRect(x - 100, y - 10, 200, 20);
        g.endFill();
        break;
      }
      case 'asteroid': {
        const size = config.size as number ?? 15;
        g.beginFill(0x555566, 0.4);
        g.moveTo(x, y - size);
        g.lineTo(x + size * 0.7, y - size * 0.3);
        g.lineTo(x + size * 0.5, y + size * 0.6);
        g.lineTo(x - size * 0.6, y + size * 0.4);
        g.lineTo(x - size * 0.8, y - size * 0.5);
        g.closePath();
        g.endFill();
        break;
      }
      case 'hologram': {
        const radius = config.radius as number ?? 30;
        const color = config.color as string ?? '#00ffff';
        const c = parseInt(color.replace('#', ''), 16);
        const pulse = 0.15 + Math.sin(this.time * 3) * 0.1;
        g.beginFill(c, pulse);
        g.drawCircle(x, y, radius);
        g.endFill();
        g.lineStyle(1, c, pulse + 0.1);
        g.drawCircle(x, y, radius);
        break;
      }
    }

    this.container.addChild(g);
  }

  private drawAmbientParticles(arena: Arena) {
    const ap = arena.ambientParticles;
    if (!ap) return;

    const particleColor = parseInt(ap.color.replace('#', ''), 16);
    const count = Math.round(20 * ap.density);

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * ap.speed;
      p.y += p.vy * ap.speed;
      p.life++;
      p.alpha = 1 - (p.life / p.maxLife);

      if (p.life >= p.maxLife || p.x < -50 || p.x > arena.width + 50 || p.y < -50 || p.y > arena.height + 50) {
        this.particles.splice(i, 1);
      }
    }

    // Spawn new particles
    while (this.particles.length < count) {
      this.particles.push({
        x: Math.random() * arena.width,
        y: Math.random() * arena.height,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2 - 0.5,
        size: 1 + Math.random() * 3,
        alpha: 0.5 + Math.random() * 0.5,
        life: 0,
        maxLife: 100 + Math.random() * 200
      });
    }

    // Draw particles
    const pg = new Graphics();
    pg.beginFill(particleColor);
    for (const p of this.particles) {
      pg.alpha = p.alpha * 0.4;
      pg.drawCircle(p.x, p.y, p.size);
    }
    pg.endFill();
    this.container.addChild(pg);
  }

  private drawBorder(arena: Arena) {
    const borderColor = parseInt(arena.colors.accent.replace('#', ''), 16);
    const borderWidth = 4;

    const topBorder = new Graphics();
    topBorder.beginFill(borderColor);
    topBorder.drawRect(0, 0, arena.width, borderWidth);
    topBorder.endFill();
    this.container.addChild(topBorder);

    const bottomBorder = new Graphics();
    bottomBorder.beginFill(borderColor);
    bottomBorder.drawRect(0, arena.height - borderWidth, arena.width, borderWidth);
    bottomBorder.endFill();
    this.container.addChild(bottomBorder);

    const leftBorder = new Graphics();
    leftBorder.beginFill(borderColor);
    leftBorder.drawRect(0, 0, borderWidth, arena.height);
    leftBorder.endFill();
    this.container.addChild(leftBorder);

    const rightBorder = new Graphics();
    rightBorder.beginFill(borderColor);
    rightBorder.drawRect(arena.width - borderWidth, 0, borderWidth, arena.height);
    rightBorder.endFill();
    this.container.addChild(rightBorder);
  }

  private drawChute(arena: Arena) {
    const chuteX = arena.width / 2;
    const chuteY = -10;
    const chuteWidth = 120;
    const chuteHeight = 60;

    const chute = new Container();

    // Chute structure - metal platform
    const platform = new Graphics();
    platform.beginFill(0x444466);
    platform.lineStyle(3, 0x8888aa);

    // Top platform
    platform.drawRect(chuteX - chuteWidth / 2 - 20, chuteY - 30, chuteWidth + 40, 15);

    // Side walls
    platform.drawRect(chuteX - chuteWidth / 2 - 20, chuteY - 30, 15, chuteHeight + 30);
    platform.drawRect(chuteX + chuteWidth / 2 + 5, chuteY - 30, 15, chuteHeight + 30);

    // Bottom opening (hatch)
    const hatchOpen = Math.min(1, this.chuteTimer / 1000); // Opens over 1 second

    // Left hatch door
    const leftHatch = new Graphics();
    leftHatch.beginFill(0x555577);
    leftHatch.lineStyle(2, 0x8888aa);
    const hatchAngle = hatchOpen * Math.PI / 2;
    leftHatch.rotation = -hatchAngle;
    leftHatch.drawRect(chuteX - chuteWidth / 2, chuteY + chuteHeight, chuteWidth / 2, 8);
    chute.addChild(leftHatch);

    // Right hatch door
    const rightHatch = new Graphics();
    rightHatch.beginFill(0x555577);
    rightHatch.lineStyle(2, 0x8888aa);
    rightHatch.rotation = hatchAngle;
    rightHatch.drawRect(chuteX + chuteWidth / 2, chuteY + chuteHeight, chuteWidth / 2, 8);
    chute.addChild(rightHatch);

    chute.addChild(platform);

    // "DROP!" text
    const dropText = new Text('⚡ DROP! ⚡', {
      fontSize: 16,
      fill: '#ffaa00',
      fontWeight: 'bold',
      fontFamily: 'Orbitron, Arial, sans-serif'
    });
    dropText.anchor.set(0.5, 0.5);
    dropText.x = chuteX;
    dropText.y = chuteY - 15;
    dropText.alpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
    chute.addChild(dropText);

    // Glow effect under chute
    const glow = new Graphics();
    glow.beginFill(0xffaa00, 0.1 + hatchOpen * 0.15);
    glow.drawCircle(chuteX, chuteY + chuteHeight / 2, 50 + hatchOpen * 20);
    glow.endFill();
    chute.addChild(glow);

    this.container.addChild(chute);
    this.chuteTimer += 16; // ~60fps increment
  }

  private drawObstacles(arena: Arena) {
    for (const obstacle of arena.obstacles) {
      const graphic = new Graphics();
      const color = parseInt(obstacle.color.replace('#', ''), 16);
      graphic.beginFill(color, obstacle.type === 'hazard' ? 0.8 : 0.6);
      graphic.drawRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 8);
      graphic.endFill();
      this.container.addChild(graphic);
    }
  }
}
