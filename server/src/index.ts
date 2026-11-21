import 'dotenv/config';
import express, { Request, Response } from 'express';
import playlistRouter from './routes/playlist';
import commentaryRouter from './routes/commentary';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/playlist', playlistRouter);
app.use('/api/commentary', commentaryRouter);

app.listen(PORT, () => {
  console.log(`Song Wars server running on http://localhost:${PORT}`);
});

export default app;
