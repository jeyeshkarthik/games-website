import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import scoresRouter from './routes/scores.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/scores', scoresRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend static files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Send all other requests to React app
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
