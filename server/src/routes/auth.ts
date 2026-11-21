import { Router, Request, Response } from 'express';
import { getLoginUrl, exchangeCodeForTokens, isLoggedIn } from '../spotify/spotifyAuth';

const router = Router();

router.get('/login', (_req: Request, res: Response) => {
  const state = Math.random().toString(36).slice(2);
  res.redirect(getLoginUrl(state));
});

router.get('/status', (_req: Request, res: Response) => {
  res.json({ loggedIn: isLoggedIn() });
});

export default router;

export async function handleCallback(req: Request, res: Response): Promise<void> {
  const { code, error } = req.query;

  if (error || typeof code !== 'string') {
    res.status(400).send(`Spotify login failed: ${error ?? 'no code returned'}`);
    return;
  }

  try {
    await exchangeCodeForTokens(code);
    res.send('Logged in to Spotify. You can close this tab and go back to the app.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).send(`Spotify login failed: ${message}`);
  }
}
