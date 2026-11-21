import { Song } from './Song';

export enum WeaponType {
  Sword = 'sword',
  Axe = 'axe',
  Spear = 'spear',
  Bow = 'bow',
  Staff = 'staff',
  Dagger = 'dagger',
  Hammer = 'hammer',
  Whip = 'whip',
  Shield = 'shield',
  EnergyBlade = 'energyBlade'
}

export enum AbilityType {
  None = 'none',
  Dash = 'dash',
  Shield = 'shield',
  Heal = 'heal',
  Stun = 'stun',
  Fireball = 'fireball',
  IceBlast = 'iceBlast',
  Lightning = 'lightning',
  Poison = 'poison',
  Teleport = 'teleport'
}

export interface CombatStats {
  health: number;           // current health
  maxHealth: number;        // maximum health
  attackDamage: number;     // base damage per attack
  attackSpeed: number;      // attacks per second
  movementSpeed: number;    // pixels per second
  defense: number;          // damage reduction (0-1)
  specialAbilityCooldown: number; // seconds
}

export interface CharacterPosition {
  x: number;
  y: number;
}

export interface Character {
  id: string;
  song: Song;
  stats: CombatStats;
  position: CharacterPosition;
  velocity: { x: number; y: number };
  weapon: WeaponType;
  ability: AbilityType;
  color: string;            // primary color hex
  secondaryColor: string;   // secondary color hex
  size: number;             // scale factor (0.8 - 1.2)
  alive: boolean;
  kills: number;
  specialAbilityReady: boolean;
  specialAbilityTimer: number; // countdown to ready
  facing: 'left' | 'right';
  attackAnimation: boolean;
  attackTimer: number;
}
