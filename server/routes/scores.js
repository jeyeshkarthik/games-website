import express from 'express';
import cors from 'cors';
import db from '../db.js';

const router = express.Router();

// Get top 10 scores for a specific game
router.get('/:game', (req, res) => {
  const game = req.params.game;
  try {
    const stmt = db.prepare('SELECT player_name, score, created_at FROM scores WHERE game = ? ORDER BY score DESC LIMIT 10');
    const scores = stmt.all(game);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Post a new score
router.post('/', (req, res) => {
  const { player_name, game, score } = req.body;
  if (!player_name || !game || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score data' });
  }

  try {
    const stmt = db.prepare('INSERT INTO scores (player_name, game, score) VALUES (?, ?, ?)');
    const info = stmt.run(player_name, game, score);
    res.status(201).json({ id: info.lastInsertRowid, player_name, game, score });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

export default router;
