import { describe, it, expect } from 'vitest';
import { calculateRelationshipScore, calculateRelationships } from '../server/src/relationships/RelationshipManager';
import { Mood, Genre, Song, SongCharacteristics } from '../shared/types/Song';

function makeSong(id: string, characteristics: SongCharacteristics): Song {
  return {
    id,
    title: id,
    artist: 'Test Artist',
    album: 'Test Album',
    artworkUrl: '',
    duration: 200,
    characteristics
  };
}

const chillSong = makeSong('a', {
  energy: 0.2, tempo: 0.2, mood: Mood.Peaceful, genre: Genre.Ambient,
  style: 'drone', acousticness: 0.8, danceability: 0.2, valence: 0.6
});

const identicalChillSong = makeSong('b', { ...chillSong.characteristics });

const intenseSong = makeSong('c', {
  energy: 0.9, tempo: 0.9, mood: Mood.Aggressive, genre: Genre.Metal,
  style: 'thrash metal', acousticness: 0.05, danceability: 0.8, valence: 0.1
});

// fully opposite on every numeric trait (0 vs 1) plus different genre/mood
const allZerosSong = makeSong('d', {
  energy: 0, tempo: 0, mood: Mood.Peaceful, genre: Genre.Ambient,
  style: 'drone', acousticness: 0, danceability: 0, valence: 0
});
const allOnesSong = makeSong('e', {
  energy: 1, tempo: 1, mood: Mood.Aggressive, genre: Genre.Metal,
  style: 'thrash metal', acousticness: 1, danceability: 1, valence: 1
});

describe('calculateRelationshipScore', () => {
  it('is symmetric', () => {
    expect(calculateRelationshipScore(chillSong, intenseSong))
      .toBe(calculateRelationshipScore(intenseSong, chillSong));
  });

  it('gives near-identical songs a strongly positive score', () => {
    const score = calculateRelationshipScore(chillSong, identicalChillSong);
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it('gives quite different songs a clearly negative score', () => {
    const score = calculateRelationshipScore(chillSong, intenseSong);
    expect(score).toBeLessThan(-20);
  });

  it('gives polar-opposite songs a strongly negative score', () => {
    const score = calculateRelationshipScore(allZerosSong, allOnesSong);
    expect(score).toBeLessThanOrEqual(-75);
  });

  it('stays within -100 to 100', () => {
    const score = calculateRelationshipScore(chillSong, intenseSong);
    expect(score).toBeGreaterThanOrEqual(-100);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('calculateRelationships', () => {
  it('creates one relationship per unique pair, with no self-pairs or duplicates', () => {
    const songs = [chillSong, identicalChillSong, intenseSong];
    const relationships = calculateRelationships(songs);
    expect(relationships).toHaveLength(3); // 3 choose 2

    const pairs = relationships.map(r => [r.character1Id, r.character2Id].sort().join('-'));
    expect(new Set(pairs).size).toBe(pairs.length);
  });
});
