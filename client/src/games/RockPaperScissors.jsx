import { useState } from 'react';

const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJI = { rock: '✊', paper: '✋', scissors: '✌️' };
const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

export default function RockPaperScissors({ onGameOver }) {
  const [playerChoice, setPlayerChoice] = useState('❓');
  const [botChoice, setBotChoice] = useState('❓');
  const [status, setStatus] = useState('Make your choice!');
  const [statusClass, setStatusClass] = useState('');
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);

  const getBotChoice = () => {
    // Basic AI without memory for simple React port (can expand later)
    return CHOICES[Math.floor(Math.random() * 3)];
  };

  const play = (p) => {
    const b = getBotChoice();
    setPlayerChoice('🌀');
    setBotChoice('🌀');
    setStatus('...');
    
    setTimeout(() => {
      setPlayerChoice(EMOJI[p]);
      setBotChoice(EMOJI[b]);
      
      if (p === b) {
        setStatus("🤝 It's a draw!"); setStatusClass('status-draw');
        setHistory(prev => [{p: EMOJI[p], b: EMOJI[b], res: 'D'}, ...prev].slice(0, 5));
      } else if (BEATS[p] === b) {
        setStatus('🎉 You win!'); setStatusClass('status-win');
        setScore(s => {
          const newScore = s + 10;
          onGameOver(newScore); // Submit to leaderboard!
          return newScore;
        });
        setHistory(prev => [{p: EMOJI[p], b: EMOJI[b], res: 'W'}, ...prev].slice(0, 5));
      } else {
        setStatus('🤖 Bot wins!'); setStatusClass('status-lose');
        setHistory(prev => [{p: EMOJI[p], b: EMOJI[b], res: 'L'}, ...prev].slice(0, 5));
      }
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={`status-msg ${statusClass}`}>{status}</div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <strong>Current Score: {score}</strong>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>YOU</div>
          <div style={{ width: '100px', height: '100px', background: 'var(--surface)', border: `2px solid var(--${statusClass === 'status-win' ? 'pastel-green' : 'border'})`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', boxShadow: 'var(--shadow-sm)' }}>
            {playerChoice}
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-light)' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>BOT</div>
          <div style={{ width: '100px', height: '100px', background: 'var(--surface)', border: `2px solid var(--${statusClass === 'status-lose' ? 'accent' : 'border'})`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', boxShadow: 'var(--shadow-sm)' }}>
            {botChoice}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        {CHOICES.map(c => (
          <button key={c} className="btn btn-secondary" style={{ width: '80px', height: '80px', fontSize: '36px', padding: 0 }} onClick={() => play(c)}>
            {EMOJI[c]}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: '100%', maxWidth: '300px' }}>
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>History</h4>
        {history.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>No rounds played yet.</p> : null}
        {history.map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span>{h.p} vs {h.b}</span>
            <strong style={{ color: h.res === 'W' ? '#10b981' : h.res === 'L' ? '#ef4444' : '#f59e0b' }}>{h.res}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
