import { SongCharacteristics, Mood, Genre } from '../../../shared/types/Song';
import { hashString, createRandom } from '../utils/deterministicRandom';

export interface AnalysableSongData {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  popularity?: number; // 0-100, from Spotify if available
  explicit?: boolean;
}

const GENRES = Object.values(Genre);

const GENRE_STYLES: Record<Genre, string[]> = {
  [Genre.Rock]: ['hard rock', 'blues rock', 'classic rock'],
  [Genre.Metal]: ['heavy metal', 'thrash metal', 'doom metal'],
  [Genre.Pop]: ['synth-pop', 'dance-pop', 'indie pop'],
  [Genre.Electronic]: ['house', 'techno', 'synthwave'],
  [Genre.HipHop]: ['rap', 'trap', 'boom bap'],
  [Genre.Jazz]: ['cool jazz', 'swing', 'bebop'],
  [Genre.Classical]: ['baroque', 'romantic', 'impressionist'],
  [Genre.Ambient]: ['drone', 'downtempo', 'soundscape'],
  [Genre.Folk]: ['acoustic folk', 'singer-songwriter', 'folk rock'],
  [Genre.Punk]: ['grunge', 'pop punk', 'hardcore'],
  [Genre.RnB]: ['soul', 'neo-soul', 'funk'],
  [Genre.Country]: ['country rock', 'bluegrass', 'outlaw country']
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function deriveMood(energy: number, valence: number): Mood {
  if (energy > 0.6 && valence >= 0.55) return valence > 0.75 ? Mood.Happy : Mood.Energetic;
  if (energy > 0.6 && valence < 0.45) return valence < 0.25 ? Mood.Dark : Mood.Aggressive;
  if (energy <= 0.6 && valence >= 0.55) return energy < 0.3 ? Mood.Peaceful : Mood.Chill;
  return valence < 0.25 ? Mood.Sad : Mood.Melancholic;
}

export function analyseSong(data: AnalysableSongData): SongCharacteristics {
  const random = createRandom(hashString(data.id));

  const baseEnergy = random();
  const baseTempo = random();
  const baseAcousticness = random();
  const baseDanceability = random();
  const baseValence = random();
  const genreRoll = random();
  const styleRoll = random();

  const popularityFactor = (data.popularity ?? 50) / 100;
  const explicitBoost = data.explicit ? 0.15 : 0;

  const energy = clamp01(baseEnergy * 0.7 + popularityFactor * 0.2 + explicitBoost);
  const tempo = clamp01(baseTempo * 0.8 + popularityFactor * 0.2);
  const acousticness = clamp01(baseAcousticness * (1 - popularityFactor * 0.3));
  const danceability = clamp01(baseDanceability * 0.7 + popularityFactor * 0.3);
  const valence = clamp01(baseValence - explicitBoost * 0.5);

  const genre = GENRES[Math.floor(genreRoll * GENRES.length)];
  const styles = GENRE_STYLES[genre];
  const style = styles[Math.floor(styleRoll * styles.length)];
  const mood = deriveMood(energy, valence);

  return { energy, tempo, mood, genre, style, acousticness, danceability, valence };
}
