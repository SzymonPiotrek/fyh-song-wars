import { Song, SongCharacteristics } from '../../../shared/types/Song';
import { Relationship, scoreToType } from '../../../shared/types/Relationship';

type NumericTrait = 'energy' | 'tempo' | 'acousticness' | 'danceability' | 'valence';
const NUMERIC_TRAITS: NumericTrait[] = ['energy', 'tempo', 'acousticness', 'danceability', 'valence'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Average absolute difference across the numeric traits (0 = identical, 1 = total opposites).
function numericDistance(a: SongCharacteristics, b: SongCharacteristics): number {
  const totalDiff = NUMERIC_TRAITS.reduce((sum, trait) => sum + Math.abs(a[trait] - b[trait]), 0);
  return totalDiff / NUMERIC_TRAITS.length;
}

export function calculateRelationshipScore(a: Song, b: Song): number {
  const similarity = 1 - numericDistance(a.characteristics, b.characteristics);
  const baseScore = (similarity - 0.5) * 200; // maps similarity 0-1 to score -100..+100

  const genreBonus = a.characteristics.genre === b.characteristics.genre ? 15 : -10;
  const moodBonus = a.characteristics.mood === b.characteristics.mood ? 10 : -5;

  return Math.round(clamp(baseScore + genreBonus + moodBonus, -100, 100));
}

export function calculateRelationships(songs: Song[]): Relationship[] {
  const relationships: Relationship[] = [];

  for (let i = 0; i < songs.length; i++) {
    for (let j = i + 1; j < songs.length; j++) {
      const score = calculateRelationshipScore(songs[i], songs[j]);
      relationships.push({
        character1Id: songs[i].id,
        character2Id: songs[j].id,
        score,
        type: scoreToType(score)
      });
    }
  }

  return relationships;
}
