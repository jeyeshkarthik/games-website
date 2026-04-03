import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

export default function Leaderboard({ gameId, refreshTrigger }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/scores/${gameId}`)
      .then(res => res.json())
      .then(data => {
        setScores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch scores:', err);
        setLoading(false);
      });
  }, [gameId, refreshTrigger]);

  return (
    <div className="leaderboard-panel">
      <h3 className="lb-title">
        <Trophy size={20} className="text-accent" />
        Top Players
      </h3>
      
      {loading ? (
        <p className="text-muted">Loading scores...</p>
      ) : scores.length === 0 ? (
        <p className="text-muted">No scores yet. Be the first!</p>
      ) : (
        <div className="lb-list">
          {scores.map((score, idx) => (
            <div key={idx} className="lb-item">
              <span className="lb-rank">#{idx + 1}</span>
              <span className="lb-name">{score.player_name}</span>
              <span className="lb-score">{score.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
