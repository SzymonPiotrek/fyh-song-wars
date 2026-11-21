import { describe, it, expect } from 'vitest';
import { analyseSong } from '../server/src/analysis/SongAnalyser';

describe('analyseSong', () => {
  const song = {
    id: 'track123',
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 200,
    popularity: 70,
    explicit: false
  };

  it('produces the same characteristics for the same song every time', () => {
    const first = analyseSong(song);
    const second = analyseSong(song);
    expect(second).toEqual(first);
  });

  it('produces different characteristics for different songs', () => {
    const a = analyseSong({ ...song, id: 'track123' });
    const b = analyseSong({ ...song, id: 'track456' });
    expect(a).not.toEqual(b);
  });

  it('keeps all numeric characteristics within 0-1', () => {
    const result = analyseSong(song);
    for (const value of [result.energy, result.tempo, result.acousticness, result.danceability, result.valence]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
