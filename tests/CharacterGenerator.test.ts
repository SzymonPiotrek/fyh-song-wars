import { describe, it, expect } from 'vitest';
import { generateCharacter } from '../server/src/characters/CharacterGenerator';
import { Mood, Genre, Song } from '../shared/types/Song';

function makeSong(id: string): Song {
  return {
    id,
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    artworkUrl: '',
    duration: 200,
    characteristics: {
      energy: 0.7,
      tempo: 0.6,
      mood: Mood.Energetic,
      genre: Genre.Rock,
      style: 'hard rock',
      acousticness: 0.2,
      danceability: 0.6,
      valence: 0.65
    }
  };
}

describe('generateCharacter', () => {
  it('produces the same character for the same song every time', () => {
    const song = makeSong('track1');
    expect(generateCharacter(song)).toEqual(generateCharacter(song));
  });

  it('keeps stats within sane bounds', () => {
    const character = generateCharacter(makeSong('track2'));
    expect(character.stats.maxHealth).toBeGreaterThan(0);
    expect(character.stats.attackDamage).toBeGreaterThan(0);
    expect(character.stats.movementSpeed).toBeGreaterThan(0);
    expect(character.stats.defense).toBeGreaterThanOrEqual(0);
    expect(character.stats.defense).toBeLessThanOrEqual(1);
  });

  it('starts alive with full health and no kills', () => {
    const character = generateCharacter(makeSong('track3'));
    expect(character.alive).toBe(true);
    expect(character.kills).toBe(0);
    expect(character.stats.health).toBe(character.stats.maxHealth);
  });
});
