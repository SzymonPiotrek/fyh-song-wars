import { Character, CombatStats, WeaponType, AbilityType } from '../../../shared/types/Character';
import { Song, SongCharacteristics, Mood, Genre } from '../../../shared/types/Song';

function createPlaceholderSong(
  id: string,
  title: string,
  artist: string,
  album: string,
  characteristics: SongCharacteristics
): Song {
  return {
    id,
    title,
    artist,
    album,
    artworkUrl: '',
    duration: 180,
    characteristics
  };
}

function createPlaceholderCharacter(
  id: string,
  title: string,
  artist: string,
  album: string,
  characteristics: SongCharacteristics,
  weapon: WeaponType,
  ability: AbilityType,
  color: string,
  secondaryColor: string,
  size: number,
  stats: Partial<CombatStats>
): Character {
  const song = createPlaceholderSong(id, title, artist, album, characteristics);

  return {
    id,
    song,
    stats: {
      health: stats.health ?? 100,
      maxHealth: stats.maxHealth ?? 100,
      attackDamage: stats.attackDamage ?? 10,
      attackSpeed: stats.attackSpeed ?? 1,
      movementSpeed: stats.movementSpeed ?? 150,
      defense: stats.defense ?? 0,
      specialAbilityCooldown: stats.specialAbilityCooldown ?? 10
    },
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
    specialAbilityTimer: 0,
    facing: 'right',
    attackAnimation: false,
    attackTimer: 0
  };
}

export function placeholderCharacters(): Character[] {
  return [
    createPlaceholderCharacter(
      '1', 'Thunderstruck', 'AC/DC', 'Highway to Hell',
      { energy: 0.9, tempo: 0.85, mood: Mood.Energetic, genre: Genre.Rock, style: 'hard rock', acousticness: 0.1, danceability: 0.6, valence: 0.8 },
      WeaponType.Axe, AbilityType.Lightning, '#FF4500', '#FFD700', 1.1,
      { health: 120, maxHealth: 120, attackDamage: 15, attackSpeed: 1.2, movementSpeed: 160, defense: 0.1 }
    ),
    createPlaceholderCharacter(
      '2', 'Bohemian Rhapsody', 'Queen', 'A Night at the Opera',
      { energy: 0.7, tempo: 0.6, mood: Mood.Happy, genre: Genre.Rock, style: 'progressive rock', acousticness: 0.3, danceability: 0.5, valence: 0.7 },
      WeaponType.Staff, AbilityType.Teleport, '#9370DB', '#FF69B4', 1.0,
      { health: 100, maxHealth: 100, attackDamage: 12, attackSpeed: 1.0, movementSpeed: 140, defense: 0.15 }
    ),
    createPlaceholderCharacter(
      '3', 'Smells Like Teen Spirit', 'Nirvana', 'Nevermind',
      { energy: 0.85, tempo: 0.8, mood: Mood.Aggressive, genre: Genre.Punk, style: 'grunge', acousticness: 0.05, danceability: 0.5, valence: 0.4 },
      WeaponType.Hammer, AbilityType.Stun, '#696969', '#8B0000', 1.15,
      { health: 130, maxHealth: 130, attackDamage: 18, attackSpeed: 0.9, movementSpeed: 130, defense: 0.2 }
    ),
    createPlaceholderCharacter(
      '4', 'Blinding Lights', 'The Weeknd', 'After Hours',
      { energy: 0.8, tempo: 0.9, mood: Mood.Energetic, genre: Genre.Electronic, style: 'synth-pop', acousticness: 0.05, danceability: 0.8, valence: 0.6 },
      WeaponType.EnergyBlade, AbilityType.Dash, '#FF1493', '#00BFFF', 0.95,
      { health: 90, maxHealth: 90, attackDamage: 14, attackSpeed: 1.5, movementSpeed: 180, defense: 0.05 }
    ),
    createPlaceholderCharacter(
      '5', 'Clair de Lune', 'Debussy', 'Suite Bergamasque',
      { energy: 0.2, tempo: 0.3, mood: Mood.Peaceful, genre: Genre.Classical, style: 'impressionist', acousticness: 0.9, danceability: 0.2, valence: 0.5 },
      WeaponType.Spear, AbilityType.Heal, '#E6E6FA', '#B0C4DE', 0.9,
      { health: 80, maxHealth: 80, attackDamage: 8, attackSpeed: 0.8, movementSpeed: 120, defense: 0.25 }
    ),
    createPlaceholderCharacter(
      '6', 'Lose Yourself', 'Eminem', '8 Mile',
      { energy: 0.9, tempo: 0.85, mood: Mood.Aggressive, genre: Genre.HipHop, style: 'rap', acousticness: 0.1, danceability: 0.7, valence: 0.5 },
      WeaponType.Dagger, AbilityType.Dash, '#FF0000', '#000000', 1.0,
      { health: 100, maxHealth: 100, attackDamage: 16, attackSpeed: 1.4, movementSpeed: 170, defense: 0.1 }
    ),
    createPlaceholderCharacter(
      '7', 'Take Five', 'Dave Brubeck', 'Time Out',
      { energy: 0.5, tempo: 0.6, mood: Mood.Chill, genre: Genre.Jazz, style: 'cool jazz', acousticness: 0.7, danceability: 0.6, valence: 0.7 },
      WeaponType.Whip, AbilityType.Teleport, '#2E8B57', '#FFD700', 0.95,
      { health: 95, maxHealth: 95, attackDamage: 11, attackSpeed: 1.1, movementSpeed: 155, defense: 0.1 }
    ),
    createPlaceholderCharacter(
      '8', 'Weightless', 'Marconi Union', 'Weightless',
      { energy: 0.1, tempo: 0.2, mood: Mood.Peaceful, genre: Genre.Ambient, style: 'ambient', acousticness: 0.5, danceability: 0.1, valence: 0.3 },
      WeaponType.Shield, AbilityType.Shield, '#B0E0E6', '#E0FFFF', 1.05,
      { health: 150, maxHealth: 150, attackDamage: 6, attackSpeed: 0.6, movementSpeed: 100, defense: 0.4 }
    ),
    createPlaceholderCharacter(
      '9', 'Sweet Child O\' Mine', 'Guns N\' Roses', 'Appetite for Destruction',
      { energy: 0.85, tempo: 0.8, mood: Mood.Energetic, genre: Genre.Rock, style: 'hard rock', acousticness: 0.1, danceability: 0.6, valence: 0.75 },
      WeaponType.Sword, AbilityType.Fireball, '#FF6347', '#FF4500', 1.05,
      { health: 110, maxHealth: 110, attackDamage: 14, attackSpeed: 1.1, movementSpeed: 150, defense: 0.12 }
    ),
    createPlaceholderCharacter(
      '10', 'Gimme Shelter', 'The Rolling Stones', 'Let It Bleed',
      { energy: 0.75, tempo: 0.7, mood: Mood.Dark, genre: Genre.Rock, style: 'blues rock', acousticness: 0.2, danceability: 0.5, valence: 0.3 },
      WeaponType.Axe, AbilityType.IceBlast, '#8B4513', '#DC143C', 1.1,
      { health: 115, maxHealth: 115, attackDamage: 13, attackSpeed: 1.0, movementSpeed: 145, defense: 0.15 }
    )
  ];
}
