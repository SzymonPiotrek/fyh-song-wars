import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder playlist endpoint
app.post('/api/playlist/import', (_req: Request, res: Response) => {
  res.json({
    message: 'Spotify integration coming soon',
    playlist: []
  });
});

app.listen(PORT, () => {
  console.log(`Song Wars server running on http://localhost:${PORT}`);
});

export default app;
