import express, { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import db from './db';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Kubernetes liveness/readiness probes hit this
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

// Create a short URL
app.post('/shorten', (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid "url" field is required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const code = nanoid(7);
  const insert = db.prepare('INSERT INTO urls (code, original_url) VALUES (?, ?)');
  insert.run(code, url);

  res.status(201).json({
    shortCode: code,
    shortUrl: `${req.protocol}://${req.get('host')}/${code}`,
    originalUrl: url,
  });
});

// Redirect a short URL to the original
app.get('/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const row = db
    .prepare('SELECT original_url FROM urls WHERE code = ?')
    .get(code) as { original_url: string } | undefined;

  if (!row) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  res.redirect(row.original_url);
});

app.listen(PORT, () => {
  console.log(`URL shortener running on port ${PORT}`);
});
