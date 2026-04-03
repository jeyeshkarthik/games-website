import { useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import ScoreModal from '../components/ScoreModal';

const games = {
  'tic-tac-toe': lazy(() => import('../games/TicTacToe')),
  'connect-four': lazy(() => import('../games/ConnectFour')),
  'snake': lazy(() => import('../games/Snake')),
  'memory-match': lazy(() => import('../games/MemoryMatch')),
  'rock-paper-scissors': lazy(() => import('../games/RockPaperScissors')),
  '2048': lazy(() => import('../games/Game2048')),
  'minesweeper': lazy(() => import('../games/Minesweeper')),
  'wordle': lazy(() => import('../games/Wordle')),
  'checkers': lazy(() => import('../games/Checkers')),
  'hangman': lazy(() => import('../games/Hangman')),
};

const gameTitles = {
  'tic-tac-toe': '⭕ Tic Tac Toe',
  'connect-four': '🔴 Connect Four',
  'snake': '🐍 Snake',
  'memory-match': '🃏 Memory Match',
  'rock-paper-scissors': '✊ Rock Paper Scissors',
  '2048': '🔢 2048',
  'minesweeper': '💣 Minesweeper',
  'wordle': '📝 Wordle',
  'checkers': '♟️ Checkers',
  'hangman': '🪢 Hangman',
};

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', emoji: '🌿' },
  { id: 'medium', label: 'Medium', emoji: '⚡' },
  { id: 'hard', label: 'Hard', emoji: '🔥' },
];

export default function GamePage() {
  const { gameId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [refreshLb, setRefreshLb] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameKey, setGameKey] = useState(0);

  const GameComponent = games[gameId];

  const handleGameOver = (score) => {
    if (score > 0) {
      setCurrentScore(score);
      setShowModal(true);
    }
  };

  const handleDifficultyChange = (d) => {
    if (d === difficulty) return;
    setDifficulty(d);
    setGameKey(prev => prev + 1);
  };

  const submitScore = async (name, score) => {
    try {
      await fetch('http://localhost:3001/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: name, game: gameId, score }),
      });
      setRefreshLb(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setShowModal(false);
    }
  };

  if (!GameComponent) {
    return <div className="container"><h2>Game not found!</h2></div>;
  }

  return (
    <div className="container">
      <div className="game-header">
        <Link to="/" className="back-btn">
          <ArrowLeft size={20} /> Back to Hub
        </Link>
        <h1 style={{ fontSize: '28px', margin: 0 }}>{gameTitles[gameId]}</h1>
        <div style={{ width: '120px' }} />
      </div>

      {/* Difficulty Selector */}
      <div className="difficulty-selector">
        <span className="difficulty-label">Difficulty:</span>
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            className={`difficulty-btn difficulty-${d.id} ${difficulty === d.id ? 'active' : ''}`}
            onClick={() => handleDifficultyChange(d.id)}
          >
            {d.emoji} {d.label}
          </button>
        ))}
      </div>

      <div className="game-layout">
        <div className="game-container">
          <Suspense fallback={<div className="status-msg">Loading game...</div>}>
            <GameComponent
              key={gameKey}
              onGameOver={handleGameOver}
              difficulty={difficulty}
            />
          </Suspense>
        </div>

        <aside>
          <Leaderboard gameId={gameId} refreshTrigger={refreshLb} />
        </aside>
      </div>

      {showModal && (
        <ScoreModal
          score={currentScore}
          onSubmit={submitScore}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
