import * as PIXI from 'pixi.js';
import { Arena } from '../../../shared/types/Arena';

const { Container, Graphics } = PIXI;

export class ArenaScene {
  private container: PIXI.Container;

  constructor(stage: PIXI.Container) {
    this.container = new Container();
    stage.addChild(this.container);
  }

  render(arena: Arena) {
    this.container.removeChildren();

    // Background
    const bg = new Graphics();
    bg.beginFill(parseInt(arena.colors.ground.replace('#', ''), 16));
    bg.drawRect(0, 0, arena.width, arena.height);
    bg.endFill();
    this.container.addChild(bg);

    // Grid pattern
    this.drawGrid(arena);

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
