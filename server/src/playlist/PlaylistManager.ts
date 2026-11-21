import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fetchPlaylist } from '../spotify/spotifyClient';
import { analyseSong } from '../analysis/SongAnalyser';
import { Playlist } from '../../../shared/types/Playlist';
import { Song } from '../../../shared/types/Song';

const DATA_DIR = path.resolve('server/data/playlists');

export async function importPlaylist(playlistUrlOrId: string): Promise<Playlist> {
  const raw = await fetchPlaylist(playlistUrlOrId);

  const songs: Song[] = raw.tracks.map(track => {
    const artist = track.artists.map(a => a.name).join(', ');
    const duration = Math.round(track.duration_ms / 1000);

    return {
      id: track.id,
      title: track.name,
      artist,
      album: track.album.name,
      artworkUrl: track.album.images[0]?.url ?? '',
      spotifyUrl: track.external_urls.spotify,
      duration,
      characteristics: analyseSong({
        id: track.id,
        title: track.name,
        artist,
        duration,
        popularity: track.popularity,
        explicit: track.explicit
      })
    };
  });

  const playlist: Playlist = {
    id: raw.id,
    name: raw.name,
    coverArtUrl: raw.coverArtUrl,
    songs
  };

  await saveToDisk(playlist);

  return playlist;
}

async function saveToDisk(playlist: Playlist): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, `${playlist.id}.json`);
  await writeFile(filePath, JSON.stringify(playlist, null, 2), 'utf-8');
}
