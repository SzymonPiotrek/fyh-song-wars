import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateCommentary } from '../commentary/CommentaryGenerator';

const router = Router();

const songInfoSchema = z.object({
  title: z.string(),
  artist: z.string(),
  genre: z.string(),
  mood: z.string()
});

const eventSchema = z.object({
  type: z.enum(['kill', 'teamup', 'winner']),
  killer: songInfoSchema.optional(),
  victim: songInfoSchema.optional(),
  teammates: z.tuple([songInfoSchema, songInfoSchema]).optional(),
  target: songInfoSchema.optional(),
  winner: songInfoSchema.optional(),
  aliveCount: z.number().optional(),
  totalCount: z.number().optional(),
  kills: z.number().optional()
});

router.post('/react', async (req: Request, res: Response) => {
  const parsed = eventSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid commentary event' });
    return;
  }

  const text = await generateCommentary(parsed.data);
  res.json({ text });
});

export default router;
