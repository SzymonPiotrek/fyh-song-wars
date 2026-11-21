import { getUserAccessToken } from './spotifyAuth';

const API_BASE = 'https://api.spotify.com/v1';

interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

interface SpotifyArtist {
  name: string;
  genres?: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  popularity: number;
  explicit: boolean;
  external_urls: { spotify: string };
  album: {
    name: string;
    release_date: string;
    images: SpotifyImage[];
  };
  artists: SpotifyArtist[];
}

interface SpotifyPlaylistItemEntry {
  item: SpotifyTrack | null;
}

interface SpotifyPlaylistItemsPage {
  items: SpotifyPlaylistItemEntry[];
  next: string | null;
}

interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  images: SpotifyImage[];
  items?: SpotifyPlaylistItemsPage;
}

export interface RawPlaylistData {
  id: string;
  name: string;
  coverArtUrl: string;
  tracks: SpotifyTrack[];
}

async function spotifyFetch<T>(url: string): Promise<T> {
  const token = await getUserAccessToken();

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify API request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export function extractPlaylistId(playlistUrlOrId: string): string {
  const match = playlistUrlOrId.match(/playlist[/:]([a-zA-Z0-9]+)/);
  if (match) return match[1];
  // assume the caller already passed a bare playlist ID
  return playlistUrlOrId.trim();
}

export async function fetchPlaylist(playlistUrlOrId: string): Promise<RawPlaylistData> {
  const playlistId = extractPlaylistId(playlistUrlOrId);

  const fields = 'id,name,images,items.items(item(id,name,duration_ms,popularity,explicit,external_urls,album(name,release_date,images),artists(name))),items.next';
  const playlist = await spotifyFetch<SpotifyPlaylistResponse>(
    `${API_BASE}/playlists/${playlistId}?fields=${encodeURIComponent(fields)}`
  );

  if (!playlist.items) {
    throw new Error('No track data available for this playlist. Make sure it is set to public.');
  }

  const tracks: SpotifyTrack[] = [];
  let page: SpotifyPlaylistItemsPage | null = playlist.items;

  while (page) {
    for (const entry of page.items) {
      if (entry.item) tracks.push(entry.item);
    }
    page = page.next ? await spotifyFetch<SpotifyPlaylistItemsPage>(page.next) : null;
  }

  return {
    id: playlist.id,
    name: playlist.name,
    coverArtUrl: playlist.images[0]?.url ?? '',
    tracks
  };
}
