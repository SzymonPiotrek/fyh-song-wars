import * as PIXI from 'pixi.js';
import { Arena } from '../../../../shared/types/Arena';

const { Container, Graphics, Text } = PIXI;

export class ArenaScene {
  private container: PIXI.Container;
  private chuteContainer: PIXI.Container | null = null;
  private chuteOpen: boolean = false;
  private chuteTimer: number = 0;

  constructor(stage: PIXI.Container) {
    this.container = new Container();
    stage.addChild(this.container);
  }

  render(arena: Arena, showChute: boolean = false, entrancePhase: boolean = false) {
    this.container.removeChildren();

    // Background
    const bg = new Graphics();
    bg.beginFill(parseInt(arena.colors.ground.replace('#', ''), 16));
    bg.drawRect(0, 0, arena.width, arena.height);
    bg.endFill();
    this.container.addChild(bg);

    // Grid pattern
    this.drawGrid(arena);

    // Obstacles
    this.drawObstacles(arena);

    // Border
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

    // Draw chute during entrance phase
    if (entrancePhase) {
      this.drawChute(arena);
    }
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

  private drawGrid(arena: Arena) {
    const gridSize = 50;
    const gridColor = parseInt(arena.colors.secondary.replace('#', ''), 16);
    const grid = new Graphics();
    grid.lineStyle(1, gridColor, 0.3);

    for (let x = 0; x <= arena.width; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, arena.height);
    }

    for (let y = 0; y <= arena.height; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(arena.width, y);
    }

    this.container.addChild(grid);
  }
}
