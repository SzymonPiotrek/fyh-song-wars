import * as PIXI from 'pixi.js';
import { Character, WeaponType } from '../../../shared/types/Character';
import { Arena } from '../../../shared/types/Arena';

const { Container, Graphics, Text } = PIXI;

export class StickmanRenderer {
  private container: PIXI.Container;
  private characterContainers: Map<string, PIXI.Container> = new Map();
  private walkPhase: Map<string, number> = new Map();

  constructor(stage: PIXI.Container) {
    this.container = new Container();
    stage.addChild(this.container);
  }

  render(characters: Character[], arena: Arena, delta: number = 1) {
    this.container.removeChildren();

    // Draw arena background
    this.drawArena(arena);

    const deltaSeconds = delta / 60;

    // Draw each character
    for (const character of characters) {
      if (!character.alive) continue;

      const charContainer = this.drawStickman(character, deltaSeconds);
      this.container.addChild(charContainer);
    }
  }

  private drawArena(arena: Arena) {
    const bg = new Graphics();
    bg.beginFill(parseInt(arena.colors.ground.replace('#', ''), 16));
    bg.drawRect(0, 0, arena.width, arena.height);
    bg.endFill();
    this.container.addChild(bg);

    // Draw border
    const border = new Graphics();
    border.lineStyle(4, parseInt(arena.colors.accent.replace('#', ''), 16));
    border.drawRect(0, 0, arena.width, arena.height);
    this.container.addChild(border);
  }

  private drawStickman(character: Character, deltaSeconds: number): PIXI.Container {
    const container = new Container();
    container.x = character.position.x;
    container.scale.set(character.size);

    const color = parseInt(character.color.replace('#', ''), 16);
    const secondaryColor = parseInt(character.secondaryColor.replace('#', ''), 16);
    const lineWeight = 3;

    // Advance a walk cycle based on how fast the character is actually moving,
    // so legs/arms swing in step with movement instead of staying in a static pose
    const speed = Math.sqrt(character.velocity.x ** 2 + character.velocity.y ** 2);
    const isWalking = speed > 10;
    const cycleSpeed = isWalking ? 6 + Math.min(6, speed / 40) : 1.5;
    const phase = (this.walkPhase.get(character.id) ?? 0) + deltaSeconds * cycleSpeed;
    this.walkPhase.set(character.id, phase);

    const legSwing = isWalking ? Math.sin(phase) * 10 : Math.sin(phase) * 1.5;
    const armSwing = isWalking ? Math.sin(phase + Math.PI) * 6 : 0;
    const bob = isWalking ? Math.abs(Math.sin(phase)) * 3 : Math.sin(phase) * 1;

    container.y = character.position.y - bob;

    const g = new Graphics();

    // Head
    g.beginFill(color);
    g.lineStyle(2, 0xffffff);
    g.drawCircle(0, -30, 10);
    g.endFill();

    // Body
    g.lineStyle(lineWeight, color);
    g.moveTo(0, -20);
    g.lineTo(0, 10);

    // Arms
    const armAngle = character.attackAnimation ? 0.5 : 0.3;
    if (character.facing === 'right') {
      // Left arm (back)
      g.moveTo(0, -10);
      g.lineTo(-15 + armSwing, -10 + Math.sin(armAngle) * 10);

      // Right arm (front, with weapon)
      g.moveTo(0, -10);
      const weaponLen = this.getWeaponLength(character.weapon);
      if (character.attackAnimation) {
        g.lineTo(20, -20);
      } else {
        g.lineTo(15, 0);
      }

      // Weapon
      this.drawWeapon(g, character, 15, -5, secondaryColor);
    } else {
      // Left arm (front, with weapon)
      g.moveTo(0, -10);
      if (character.attackAnimation) {
        g.lineTo(-20, -20);
      } else {
        g.lineTo(-15, 0);
      }

      // Right arm (back)
      g.moveTo(0, -10);
      g.lineTo(15 - armSwing, -10 + Math.sin(armAngle) * 10);

      // Weapon
      this.drawWeapon(g, character, -15, -5, secondaryColor);
    }

    // Legs
    g.moveTo(0, 10);
    g.lineTo(-10 + legSwing, 30);

    g.moveTo(0, 10);
    g.lineTo(10 - legSwing, 30);

    container.addChild(g);

    // Health bar
    const healthPercent = character.stats.health / character.stats.maxHealth;
    const healthBarWidth = 40;
    const healthBarHeight = 4;

    // Health bar background
    const hbBg = new Graphics();
    hbBg.beginFill(0x333333);
    hbBg.drawRect(-healthBarWidth / 2, -50, healthBarWidth, healthBarHeight);
    hbBg.endFill();
    container.addChild(hbBg);

    // Health bar fill
    const hbFill = new Graphics();
    const fillWidth = healthBarWidth * healthPercent;
    const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    hbFill.beginFill(healthColor);
    hbFill.drawRect(-healthBarWidth / 2, -50, fillWidth, healthBarHeight);
    hbFill.endFill();
    container.addChild(hbFill);

    // Name label
    const nameText = new Text({
      text: character.song.title,
      style: {
        fontSize: 10,
        fill: '#ffffff',
        fontWeight: 'bold'
      }
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = 0;
    nameText.y = -55;
    container.addChild(nameText);

    this.characterContainers.set(character.id, container);

    return container;
  }

  private getWeaponLength(weapon: WeaponType): number {
    switch (weapon) {
      case WeaponType.Spear:
        return 30;
      case WeaponType.Bow:
        return 25;
      case WeaponType.Staff:
        return 28;
      case WeaponType.Whip:
        return 35;
      default:
        return 20;
    }
  }

  private drawWeapon(g: Graphics, character: Character, x: number, y: number, color: number) {
    const weaponLen = this.getWeaponLength(character.weapon);

    switch (character.weapon) {
      case WeaponType.Sword:
        g.lineStyle(3, color);
        g.moveTo(x, y);
        g.lineTo(x + (character.facing === 'right' ? weaponLen : -weaponLen), y - 5);
        break;
      case WeaponType.Axe:
        g.lineStyle(3, color);
        g.moveTo(x, y);
        g.lineTo(x + (character.facing === 'right' ? weaponLen : -weaponLen), y);
        // Axe head
        g.beginFill(color);
        g.drawCircle(x + (character.facing === 'right' ? weaponLen : -weaponLen), y, 5);
        g.endFill();
        break;
      case WeaponType.Spear:
        g.lineStyle(2, color);
        g.moveTo(x, y);
        g.lineTo(x + (character.facing === 'right' ? weaponLen : -weaponLen), y - 10);
        // Spear tip
        g.beginFill(0xcccccc);
        g.moveTo(x + (character.facing === 'right' ? weaponLen - 5 : -weaponLen + 5), y - 8);
        g.lineTo(x + (character.facing === 'right' ? weaponLen : -weaponLen), y - 10);
        g.lineTo(x + (character.facing === 'right' ? weaponLen - 5 : -weaponLen + 5), y - 12);
        g.endFill();
        break;
      case WeaponType.Bow:
        g.lineStyle(2, color);
        g.moveTo(x, y - 10);
        g.lineTo(x + (character.facing === 'right' ? 10 : -10), y);
        g.lineTo(x, y + 10);
        break;
      case WeaponType.Staff:
        g.lineStyle(3, color);
        g.moveTo(x, y + 5);
        g.lineTo(x + (character.facing === 'right' ? weaponLen : -weaponLen), y - 15);
        // Staff orb
        g.beginFill(0x00ffff);
        g.drawCircle(x + (character.facing === 'right' ? weaponLen : -weaponLen), y - 15, 4);
        g.endFill();
        break;
      case WeaponType.Dagger:
        g.lineStyle(2, color);
        g.moveTo(x, y);
        g.lineTo(x + (character.facing === 'right' ? 12 : -12), y - 5);
        break;
      case WeaponType.Hammer:
        g.lineStyle(3, color);
        g.moveTo(x, y);
        g.lineTo(x + (character.facing === 'right' ? weaponLen - 5 : -weaponLen + 5), y);
        // Hammer head
        g.beginFill(color);
        g.drawRect(
          x + (character.facing === 'right' ? weaponLen - 8 : -weaponLen - 2),
          y - 6,
          8,
          12
        );
        g.endFill();
        break;
      case WeaponType.Whip:
        for (let i = 0; i < 5; i++) {
          const wx = x + (character.facing === 'right' ? i * 6 : -i * 6);
          const wy = y + Math.sin(i * 0.5) * 3;
          const nx = x + (character.facing === 'right' ? (i + 1) * 6 : -(i + 1) * 6);
          const ny = y + Math.sin((i + 1) * 0.5) * 3;
          g.lineStyle(Math.max(1, 3 - i), color);
          g.moveTo(wx, wy);
          g.lineTo(nx, ny);
        }
        break;
      case WeaponType.Shield:
        g.beginFill(0x4444ff);
        g.lineStyle(2, 0x8888ff);
        g.drawRect(x - 8, y - 12, 16, 24);
        g.endFill();
        break;
      case WeaponType.EnergyBlade:
        g.lineStyle(4, 0x00ffff);
        g.moveTo(x, y);
        g.lineTo(x + (character.facing === 'right' ? weaponLen : -weaponLen), y - 5);
        g.lineStyle(2, 0xffffff);
        g.moveTo(x, y);
        g.lineTo(x + (character.facing === 'right' ? weaponLen : -weaponLen), y - 5);
        break;
    }
  }
}
