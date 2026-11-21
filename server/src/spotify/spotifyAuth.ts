const REDIRECT_URI = 'http://127.0.0.1:3001/callback';
const SCOPES = 'playlist-read-private playlist-read-collaborative';

interface UserTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Single-user hackathon scope: one logged-in Spotify account at a time.
let userTokens: UserTokens | null = null;

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment');
  }

  return { clientId, clientSecret };
}

export function getLoginUrl(state: string): string {
  const { clientId } = getClientCredentials();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const { clientId, clientSecret } = getClientCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify token exchange failed (${response.status}): ${body}`);
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in: number };

  userTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000
  };
}

async function refreshAccessToken(): Promise<void> {
  if (!userTokens) throw new Error('Not logged in to Spotify');

  const { clientId, clientSecret } = getClientCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: userTokens.refreshToken
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify token refresh failed (${response.status}): ${body}`);
  }

  const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };

  userTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? userTokens.refreshToken,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000
  };
}

export function isLoggedIn(): boolean {
  return userTokens !== null;
}

export async function getUserAccessToken(): Promise<string> {
  if (!userTokens) {
    throw new Error('Not logged in to Spotify. Visit /api/auth/login first.');
  }

  if (Date.now() >= userTokens.expiresAt) {
    await refreshAccessToken();
  }

  return userTokens!.accessToken;
}
