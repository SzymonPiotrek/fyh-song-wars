export interface SongCharacteristics {
  energy: number;        // 0-1, influences aggression and attack frequency
  tempo: number;         // 0-1, influences movement and attack speed
  mood: Mood;            // overall personality
  genre: Genre;          // fighting style and weapon type
  style: string;         // sub-genre or descriptor for special abilities
  acousticness: number;  // 0-1
  danceability: number;  // 0-1
  valence: number;       // 0-1, musical positiveness
}

export enum Mood {
  Happy = 'happy',
  Sad = 'sad',
  Energetic = 'energetic',
  Chill = 'chill',
  Dark = 'dark',
  Melancholic = 'melancholic',
  Aggressive = 'aggressive',
  Peaceful = 'peaceful'
}

export enum Genre {
  Rock = 'rock',
  Metal = 'metal',
  Pop = 'pop',
  Electronic = 'electronic',
  HipHop = 'hiphop',
  Jazz = 'jazz',
  Classical = 'classical',
  Ambient = 'ambient',
  Folk = 'folk',
  Punk = 'punk',
  RnB = 'rnb',
  Country = 'country'
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  spotifyUrl?: string;
  duration: number;        // seconds
  characteristics: SongCharacteristics;
}
