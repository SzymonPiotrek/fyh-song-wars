interface AppToken {
  accessToken: string;
  expiresAt: number;
}

let appToken: AppToken | null = null;

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment');
  }

  return { clientId, clientSecret };
}

async function fetchAppToken(): Promise<void> {
  const { clientId, clientSecret } = getClientCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify app token request failed (${response.status}): ${body}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };

  appToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000
  };
}

export async function getAppAccessToken(): Promise<string> {
  if (!appToken || Date.now() >= appToken.expiresAt) {
    await fetchAppToken();
  }

  return appToken!.accessToken;
}
