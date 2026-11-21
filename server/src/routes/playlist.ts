import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { importPlaylist } from '../playlist/PlaylistManager';
import { generateCharacter } from '../characters/CharacterGenerator';
import { calculateRelationships } from '../relationships/RelationshipManager';

const router = Router();

const importRequestSchema = z.object({
  playlistUrl: z.string().min(1)
});

router.post('/import', async (req: Request, res: Response) => {
  const parsed = importRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'playlistUrl is required' });
    return;
  }

  try {
    const playlist = await importPlaylist(parsed.data.playlistUrl);
    const characters = playlist.songs.map(generateCharacter);
    const relationships = calculateRelationships(playlist.songs);
    res.json({ playlist, characters, relationships });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ error: message });
  }
});

export default router;
