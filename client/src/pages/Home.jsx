import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const GAMES = [
  { id: 'tic-tac-toe', title: 'Tic Tac Toe', icon: '⭕', desc: 'Face the unbeatable Minimax AI. Every move is calculated — think ahead or lose.' },
  { id: 'connect-four', title: 'Connect Four', icon: '🔴', desc: 'Drop discs and connect four in a row. The bot plans multiple moves ahead.' },
  { id: 'snake', title: 'Snake', icon: '🐍', desc: 'Classic snake with a modern twist. Eat, grow, and don\'t bite yourself!' },
  { id: 'memory-match', title: 'Memory Match', icon: '🃏', desc: 'Flip cards and find all pairs before time runs out. Test your memory!' },
  { id: 'rock-paper-scissors', title: 'Rock Paper Scissors', icon: '✊', desc: 'The bot learns your patterns. Will you figure it out before it beats you?' },
  { id: '2048', title: '2048', icon: '🔢', desc: 'Slide tiles, merge numbers, reach 2048. Addictive and deceptively hard.' },
  { id: 'minesweeper', title: 'Minesweeper', icon: '💣', desc: 'Uncover tiles without hitting mines. Use logic and luck to survive.' },
  { id: 'wordle', title: 'Wordle', icon: '📝', desc: 'Guess the hidden 5-letter word in 6 tries. Green, yellow, gray — your only clues.' },
  { id: 'checkers', title: 'Checkers', icon: '♟️', desc: 'Classic draughts against a strategic bot. Master jumps and become king!' },
  { id: 'hangman', title: 'Hangman', icon: '🪢', desc: 'Guess the word letter by letter. 6 wrong guesses and it\'s game over!' },
];

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <h1 className="hero-title gradient-text">GameZone</h1>
        <p className="hero-sub">
          Challenge smart AI bots across 10 beautifully crafted classic games.<br />
          Climb the global leaderboards and prove your skills.
        </p>
      </section>

      <section className="games-grid">
        {GAMES.map(game => (
          <Link key={game.id} to={`/games/${game.id}`} className="game-card">
            <div className="card-icon">{game.icon}</div>
            <h3 className="card-title">{game.title}</h3>
            <p className="card-desc">{game.desc}</p>
            <div className="card-footer">
              <Play size={18} /> Play Now
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
