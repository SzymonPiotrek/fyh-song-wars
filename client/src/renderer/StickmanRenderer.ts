import * as PIXI from 'pixi.js';
import { Character, WeaponType } from '../../../shared/types/Character';
import { Arena } from '../../../shared/types/Arena';
import { Mood } from '../../../shared/types/Song';

const { Container, Graphics, Text } = PIXI;

// Overall size multiplier applied on top of each character's own size factor,
// so stickmen read clearly on screen instead of looking tiny/sparse.
const BASE_SCALE = 1.5;

type Expression = 'angry' | 'fierce' | 'happy' | 'sad' | 'calm';

interface Personality {
  stanceWidth: number;       // leg spread multiplier (wide/aggressive vs narrow/timid)
  leanForward: number;       // horizontal offset of head/torso in the facing direction
  walkSpeedMultiplier: number;
  bobMultiplier: number;
  expression: Expression;
}

const PERSONALITY_BY_MOOD: Record<Mood, Personality> = {
  [Mood.Aggressive]: { stanceWidth: 1.4, leanForward: 3, walkSpeedMultiplier: 1.4, bobMultiplier: 0.8, expression: 'angry' },
  [Mood.Dark]: { stanceWidth: 1.3, leanForward: 2, walkSpeedMultiplier: 1.2, bobMultiplier: 0.7, expression: 'fierce' },
  [Mood.Energetic]: { stanceWidth: 1.2, leanForward: 1, walkSpeedMultiplier: 1.3, bobMultiplier: 1.5, expression: 'happy' },
  [Mood.Happy]: { stanceWidth: 1.1, leanForward: 0, walkSpeedMultiplier: 1.1, bobMultiplier: 1.4, expression: 'happy' },
  [Mood.Chill]: { stanceWidth: 0.9, leanForward: -1, walkSpeedMultiplier: 0.8, bobMultiplier: 0.7, expression: 'calm' },
  [Mood.Peaceful]: { stanceWidth: 0.9, leanForward: -1, walkSpeedMultiplier: 0.7, bobMultiplier: 0.6, expression: 'calm' },
  [Mood.Melancholic]: { stanceWidth: 0.8, leanForward: -2, walkSpeedMultiplier: 0.7, bobMultiplier: 0.5, expression: 'sad' },
  [Mood.Sad]: { stanceWidth: 0.8, leanForward: -3, walkSpeedMultiplier: 0.6, bobMultiplier: 0.4, expression: 'sad' }
};

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

  // Draws a two-segment limb (e.g. upper arm + forearm) from an origin point,
  // with a small joint circle at the bend, and returns the end point so callers
  // can attach things like weapons to the hand.
  private drawLimb(
    g: PIXI.Graphics,
    originX: number,
    originY: number,
    angle1: number,
    len1: number,
    angle2: number,
    len2: number,
    color: number,
    thickness: number
  ): { x: number; y: number } {
    const jointX = originX + Math.cos(angle1) * len1;
    const jointY = originY + Math.sin(angle1) * len1;
    const totalAngle = angle1 + angle2;
    const endX = jointX + Math.cos(totalAngle) * len2;
    const endY = jointY + Math.sin(totalAngle) * len2;

    g.lineStyle(thickness, color);
    g.moveTo(originX, originY);
    g.lineTo(jointX, jointY);
    g.lineTo(endX, endY);

    g.beginFill(color);
    g.drawCircle(jointX, jointY, thickness * 0.55);
    g.endFill();

    return { x: endX, y: endY };
  }

  // Angles are authored as if facing right; mirror them across the vertical
  // axis for characters facing left so poses stay anatomically consistent.
  private mirrorAngle(angle: number, dir: number): number {
    return dir === 1 ? angle : Math.PI - angle;
  }

  private drawFace(g: PIXI.Graphics, expression: Expression, headY: number) {
    const browY = headY - 4;
    const mouthY = headY + 5;

    switch (expression) {
      case 'angry':
        g.lineStyle(2, 0x000000);
        g.moveTo(-7, browY - 2);
        g.lineTo(-2, browY + 1);
        g.moveTo(7, browY - 2);
        g.lineTo(2, browY + 1);
        g.moveTo(-5, mouthY);
        g.lineTo(5, mouthY);
        break;
      case 'fierce':
        g.lineStyle(2, 0xff2222);
        g.moveTo(-7, browY - 2);
        g.lineTo(-2, browY + 1);
        g.moveTo(7, browY - 2);
        g.lineTo(2, browY + 1);
        g.beginFill(0xff2222);
        g.drawCircle(-4, browY + 4, 1.3);
        g.drawCircle(4, browY + 4, 1.3);
        g.endFill();
        break;
      case 'happy':
        g.lineStyle(2, 0x000000);
        g.moveTo(-6, browY);
        g.lineTo(-2, browY - 1);
        g.moveTo(6, browY);
        g.lineTo(2, browY - 1);
        g.moveTo(-5, mouthY - 2);
        g.quadraticCurveTo(0, mouthY + 3, 5, mouthY - 2);
        break;
      case 'sad':
        g.lineStyle(2, 0x000000);
        g.moveTo(-7, browY + 1);
        g.lineTo(-2, browY - 2);
        g.moveTo(7, browY + 1);
        g.lineTo(2, browY - 2);
        g.moveTo(-5, mouthY + 1);
        g.quadraticCurveTo(0, mouthY - 3, 5, mouthY + 1);
        break;
      case 'calm':
      default:
        g.lineStyle(2, 0x000000);
        g.moveTo(-6, browY);
        g.lineTo(-2, browY);
        g.moveTo(6, browY);
        g.lineTo(2, browY);
        g.moveTo(-5, mouthY);
        g.lineTo(5, mouthY);
        break;
    }
  }

  private drawStickman(character: Character, deltaSeconds: number): PIXI.Container {
    const container = new Container();
    container.x = character.position.x;
    container.scale.set(character.size * BASE_SCALE);

    const color = parseInt(character.color.replace('#', ''), 16);
    const secondaryColor = parseInt(character.secondaryColor.replace('#', ''), 16);
    const lineWeight = 3.5;

    const personality = PERSONALITY_BY_MOOD[character.song.characteristics.mood] ?? PERSONALITY_BY_MOOD[Mood.Chill];
    const dir = character.facing === 'right' ? 1 : -1;

    // Advance a walk cycle based on how fast the character is actually moving,
    // so legs/arms swing in step with movement instead of staying in a static pose
    const speed = Math.sqrt(character.velocity.x ** 2 + character.velocity.y ** 2);
    const isWalking = speed > 10;
    const cycleSpeed = (isWalking ? 6 + Math.min(6, speed / 40) : 1.5) * personality.walkSpeedMultiplier;
    const phase = (this.walkPhase.get(character.id) ?? 0) + deltaSeconds * cycleSpeed;
    this.walkPhase.set(character.id, phase);

    const legSwingAmp = isWalking ? 0.5 : 0.08;
    const kneeBendAmp = isWalking ? 0.5 : 0.1;
    const armSwingAmp = isWalking ? 0.4 : 0.05;
    const bob = (isWalking ? Math.abs(Math.sin(phase)) * 3 : Math.sin(phase) * 1) * personality.bobMultiplier;

    container.y = character.position.y - bob;

    // Angry/fierce characters get a faint aura behind them reinforcing their hot color
    if (personality.expression === 'angry' || personality.expression === 'fierce') {
      const aura = new Graphics();
      aura.beginFill(color, 0.15);
      aura.drawCircle(0, -14, 28);
      aura.endFill();
      container.addChild(aura);
    }

    const g = new Graphics();

    // Body geometry (local/unscaled units; facing-right is canonical, mirrored via dir)
    const leanX = dir * personality.leanForward;
    const hipY = 14;
    const shoulderY = -18;
    const neckTopY = -24;
    const headY = -35;
    const headRadius = 11;
    const shoulderHalfWidth = 9;
    const hipHalfWidth = 5 * personality.stanceWidth;
    const upperArmLen = 13;
    const forearmLen = 13;
    const thighLen = 16;
    const shinLen = 16;

    // Legs
    const hipX = leanX * 0.3;
    const thighA = this.mirrorAngle(Math.PI / 2 - Math.sin(phase) * legSwingAmp, dir);
    const shinA = Math.sin(phase) * kneeBendAmp;
    const thighB = this.mirrorAngle(Math.PI / 2 + Math.sin(phase) * legSwingAmp, dir);
    const shinB = -Math.sin(phase) * kneeBendAmp;

    this.drawLimb(g, hipX - hipHalfWidth, hipY, thighA, thighLen, shinA, shinLen, color, lineWeight);
    this.drawLimb(g, hipX + hipHalfWidth, hipY, thighB, thighLen, shinB, shinLen, color, lineWeight);

    // Torso (leans with personality, e.g. aggressive leans in, sad slouches back)
    g.lineStyle(lineWeight, color);
    g.moveTo(hipX, hipY);
    g.lineTo(leanX, shoulderY);
    g.moveTo(leanX, shoulderY);
    g.lineTo(leanX, neckTopY);

    // Arms: back (non-weapon) arm swings naturally; weapon arm swings or strikes
    const backShoulderX = leanX - dir * shoulderHalfWidth;
    const weaponShoulderX = leanX + dir * shoulderHalfWidth;

    const backArmAngle = this.mirrorAngle(Math.PI / 2 + Math.sin(phase + Math.PI) * armSwingAmp, dir);
    const backForearmBend = 0.3 + Math.sin(phase) * 0.15;
    this.drawLimb(g, backShoulderX, shoulderY, backArmAngle, upperArmLen, backForearmBend, forearmLen, color, lineWeight);

    const weaponArmAngle = this.mirrorAngle(
      character.attackAnimation ? -0.3 : Math.PI / 2 + Math.sin(phase) * armSwingAmp * 0.6,
      dir
    );
    const weaponForearmBend = character.attackAnimation ? -0.6 : 0.3;
    const handPos = this.drawLimb(
      g,
      weaponShoulderX,
      shoulderY,
      weaponArmAngle,
      upperArmLen,
      weaponForearmBend,
      forearmLen,
      color,
      lineWeight
    );

    // Weapon, anchored to the actual hand position of the (possibly bent/raised) arm
    this.drawWeapon(g, character, handPos.x, handPos.y, secondaryColor);

    // Head
    g.beginFill(color);
    g.lineStyle(2, 0xffffff);
    g.drawCircle(leanX, headY, headRadius);
    g.endFill();

    // Face (expression tied to the song's mood/personality)
    this.drawFace(g, personality.expression, headY);

    container.addChild(g);

    // Health bar
    const healthPercent = character.stats.health / character.stats.maxHealth;
    const healthBarWidth = 40;
    const healthBarHeight = 4;
    const healthBarY = -58;

    // Health bar background
    const hbBg = new Graphics();
    hbBg.beginFill(0x333333);
    hbBg.drawRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    hbBg.endFill();
    container.addChild(hbBg);

    // Health bar fill
    const hbFill = new Graphics();
    const fillWidth = healthBarWidth * healthPercent;
    const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    hbFill.beginFill(healthColor);
    hbFill.drawRect(-healthBarWidth / 2, healthBarY, fillWidth, healthBarHeight);
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
    nameText.y = -63;
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
