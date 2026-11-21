import { Song, Genre, Mood } from '../../../shared/types/Song';
import { Character, WeaponType, AbilityType, CombatStats } from '../../../shared/types/Character';
import { hashString, createRandom, pick } from '../utils/deterministicRandom';

const WEAPONS_BY_GENRE: Record<Genre, WeaponType[]> = {
  [Genre.Rock]: [WeaponType.Sword, WeaponType.Axe],
  [Genre.Metal]: [WeaponType.Axe, WeaponType.Hammer],
  [Genre.Pop]: [WeaponType.Staff, WeaponType.Dagger],
  [Genre.Electronic]: [WeaponType.EnergyBlade],
  [Genre.HipHop]: [WeaponType.Dagger, WeaponType.Whip],
  [Genre.Jazz]: [WeaponType.Whip, WeaponType.Staff],
  [Genre.Classical]: [WeaponType.Spear, WeaponType.Staff],
  [Genre.Ambient]: [WeaponType.Shield],
  [Genre.Folk]: [WeaponType.Bow, WeaponType.Spear],
  [Genre.Punk]: [WeaponType.Hammer, WeaponType.Dagger],
  [Genre.RnB]: [WeaponType.Whip, WeaponType.Dagger],
  [Genre.Country]: [WeaponType.Bow, WeaponType.Axe]
};

const ABILITIES_BY_MOOD: Record<Mood, AbilityType[]> = {
  [Mood.Happy]: [AbilityType.Dash, AbilityType.Lightning],
  [Mood.Energetic]: [AbilityType.Lightning, AbilityType.Dash],
  [Mood.Chill]: [AbilityType.Teleport, AbilityType.IceBlast],
  [Mood.Dark]: [AbilityType.Fireball, AbilityType.Poison],
  [Mood.Melancholic]: [AbilityType.IceBlast, AbilityType.Teleport],
  [Mood.Aggressive]: [AbilityType.Stun, AbilityType.Fireball],
  [Mood.Peaceful]: [AbilityType.Heal, AbilityType.Shield],
  [Mood.Sad]: [AbilityType.Heal, AbilityType.IceBlast]
};

// hue range (degrees) each mood draws its color from
const HUE_RANGE_BY_MOOD: Record<Mood, [number, number]> = {
  [Mood.Happy]: [40, 60],
  [Mood.Energetic]: [10, 30],
  [Mood.Chill]: [160, 200],
  [Mood.Dark]: [260, 300],
  [Mood.Melancholic]: [210, 240],
  [Mood.Aggressive]: [0, 10],
  [Mood.Peaceful]: [90, 140],
  [Mood.Sad]: [220, 250]
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
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

function deriveColors(mood: Mood, danceability: number, valence: number, random: () => number): { color: string; secondaryColor: string } {
  const [hueMin, hueMax] = HUE_RANGE_BY_MOOD[mood];
  const hue = hueMin + random() * (hueMax - hueMin);
  const saturation = 50 + danceability * 40;
  const lightness = 45 + valence * 15;

  return {
    color: hslToHex(hue, saturation, lightness),
    secondaryColor: hslToHex((hue + 40) % 360, saturation, Math.max(25, lightness - 15))
  };
}

// how heavy each weapon is (0 = lightest/fastest, 1 = heaviest/slowest)
const WEAPON_WEIGHT: Record<WeaponType, number> = {
  [WeaponType.Dagger]: 0.1,
  [WeaponType.Whip]: 0.2,
  [WeaponType.EnergyBlade]: 0.3,
  [WeaponType.Bow]: 0.35,
  [WeaponType.Sword]: 0.45,
  [WeaponType.Staff]: 0.5,
  [WeaponType.Spear]: 0.6,
  [WeaponType.Shield]: 0.65,
  [WeaponType.Axe]: 0.75,
  [WeaponType.Hammer]: 1
};

function deriveStats(song: Song, weapon: WeaponType): CombatStats {
  const { energy, tempo, acousticness } = song.characteristics;
  const weight = WEAPON_WEIGHT[weapon];

  // heavier weapons hit harder but swing slower - damage and speed move opposite ways
  const damageMultiplier = 0.7 + weight;
  const speedMultiplier = 1.3 - weight;

  return {
    maxHealth: Math.round(150 - energy * 70),
    health: Math.round(150 - energy * 70),
    attackDamage: Math.round((6 + energy * 14) * damageMultiplier),
    attackSpeed: Math.round((0.6 + tempo) * speedMultiplier * 100) / 100,
    movementSpeed: Math.round(100 + tempo * 100),
    defense: Math.round(clamp01(0.45 - energy * 0.4) * 100) / 100,
    specialAbilityCooldown: Math.round((15 - tempo * 8) * 10) / 10
  };
}

export function generateCharacter(song: Song): Character {
  const random = createRandom(hashString(`${song.id}:character`));
  const { genre, mood, danceability, valence } = song.characteristics;

  const weapon = pick(WEAPONS_BY_GENRE[genre], random);
  const ability = pick(ABILITIES_BY_MOOD[mood], random);
  const { color, secondaryColor } = deriveColors(mood, danceability, valence, random);
  const size = Math.round((0.85 + random() * 0.3) * 100) / 100;
  const stats = deriveStats(song, weapon);

  return {
    id: song.id,
    song,
    stats,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    weapon,
    ability,
    color,
    secondaryColor,
    size,
    alive: true,
    kills: 0,
    specialAbilityReady: false,
    specialAbilityTimer: stats.specialAbilityCooldown,
    facing: 'right',
    attackAnimation: false,
    attackTimer: 0
  };
}
