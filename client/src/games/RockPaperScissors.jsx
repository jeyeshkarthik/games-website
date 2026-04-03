import { useState } from 'react';

const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJI = { rock: '✊', paper: '✋', scissors: '✌️' };
const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
const ROUND_OPTIONS = [3, 5, 7, 9];

const SCORE_PER_WIN = 20;

export default function RockPaperScissors({ onGameOver }) {
  const [totalRounds, setTotalRounds] = useState(5);
  const [phase, setPhase] = useState('setup'); // 'setup' | 'playing' | 'finished'

  const [playerChoice, setPlayerChoice] = useState('❓');
  const [botChoice, setBotChoice] = useState('❓');
  const [roundResult, setRoundResult] = useState('');
  const [roundResultClass, setRoundResultClass] = useState('');

  const [playerWins, setPlayerWins] = useState(0);
  const [botWins, setBotWins] = useState(0);
  const [draws, setDraws] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [history, setHistory] = useState([]);
  const [gameResult, setGameResult] = useState(''); // 'player' | 'bot' | 'draw'
  const [animating, setAnimating] = useState(false);

  const startGame = (rounds) => {
    setTotalRounds(rounds);
    setPhase('playing');
    resetRoundState();
  };

  const resetRoundState = () => {
    setPlayerChoice('❓');
    setBotChoice('❓');
    setRoundResult('');
    setRoundResultClass('');
  };

  const play = (p) => {
    if (animating || phase !== 'playing') return;
    setAnimating(true);
    const b = CHOICES[Math.floor(Math.random() * 3)];
    setPlayerChoice('🌀');
    setBotChoice('🌀');
    setRoundResult('...');
    setRoundResultClass('');

    setTimeout(() => {
      setPlayerChoice(EMOJI[p]);
      setBotChoice(EMOJI[b]);

      let res, resClass, newPlayerWins, newBotWins, newDraws;

      if (p === b) {
        res = "🤝 Draw!";
        resClass = '';
        newDraws = draws + 1;
        newPlayerWins = playerWins;
        newBotWins = botWins;
      } else if (BEATS[p] === b) {
        res = '🎉 You win this round!';
        resClass = 'status-win';
        newPlayerWins = playerWins + 1;
        newBotWins = botWins;
        newDraws = draws;
      } else {
        res = '🤖 Bot wins this round!';
        resClass = 'status-lose';
        newBotWins = botWins + 1;
        newPlayerWins = playerWins;
        newDraws = draws;
      }

      const newRoundsPlayed = roundsPlayed + 1;
      setPlayerWins(newPlayerWins);
      setBotWins(newBotWins);
      setDraws(newDraws);
      setRoundsPlayed(newRoundsPlayed);
      setRoundResult(res);
      setRoundResultClass(resClass);
      setHistory(prev => [
        { p: EMOJI[p], b: EMOJI[b], res: p === b ? 'D' : BEATS[p] === b ? 'W' : 'L' },
        ...prev,
      ]);

      // Check if game is over
      const majority = Math.ceil(totalRounds / 2);
      const isOver = newPlayerWins >= majority || newBotWins >= majority || newRoundsPlayed >= totalRounds;

      if (isOver) {
        setTimeout(() => {
          // Determine final winner
          let result;
          if (newPlayerWins > newBotWins) {
            result = 'player';
          } else if (newBotWins > newPlayerWins) {
            result = 'bot';
          } else {
            // It's a tie — next to win wins (handled by not ending yet, but we've used all rounds)
            result = 'tiebreak';
          }
          setGameResult(result);
          setPhase('finished');
          if (result === 'player') {
            onGameOver(newPlayerWins * SCORE_PER_WIN);
          }
        }, 800);
      }

      setAnimating(false);
    }, 500);
  };

  // Tiebreak: continue playing one round at a time until someone wins
  const playTiebreak = (p) => {
    if (animating) return;
    setAnimating(true);
    const b = CHOICES[Math.floor(Math.random() * 3)];
    setPlayerChoice('🌀');
    setBotChoice('🌀');
    setRoundResult('...');

    setTimeout(() => {
      setPlayerChoice(EMOJI[p]);
      setBotChoice(EMOJI[b]);

      if (p === b) {
        setRoundResult("🤝 Draw again! Keep going...");
        setRoundResultClass('');
        setAnimating(false);
      } else if (BEATS[p] === b) {
        setRoundResult('🎉 You win the tiebreak!');
        setRoundResultClass('status-win');
        setPlayerWins(prev => prev + 1);
        setHistory(prev => [{ p: EMOJI[p], b: EMOJI[b], res: 'W' }, ...prev]);
        setTimeout(() => {
          setGameResult('player');
          onGameOver((playerWins + 1) * SCORE_PER_WIN);
        }, 600);
        setAnimating(false);
      } else {
        setRoundResult('🤖 Bot wins the tiebreak!');
        setRoundResultClass('status-lose');
        setBotWins(prev => prev + 1);
        setHistory(prev => [{ p: EMOJI[p], b: EMOJI[b], res: 'L' }, ...prev]);
        setTimeout(() => {
          setGameResult('bot');
        }, 600);
        setAnimating(false);
      }
    }, 500);
  };

  const resetGame = () => {
    setPhase('setup');
    setPlayerChoice('❓');
    setBotChoice('❓');
    setRoundResult('');
    setRoundResultClass('');
    setPlayerWins(0);
    setBotWins(0);
    setDraws(0);
    setRoundsPlayed(0);
    setHistory([]);
    setGameResult('');
  };

  const roundsLeft = totalRounds - roundsPlayed;
  const majority = Math.ceil(totalRounds / 2);

  // Setup screen
  if (phase === 'setup') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div className="status-msg">Choose number of rounds</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', margin: 0 }}>
          First to win the majority wins! If tied after all rounds, sudden death continues.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {ROUND_OPTIONS.map(n => (
            <button
              key={n}
              className="btn btn-secondary"
              style={{
                width: '80px', height: '80px', fontSize: '24px', fontWeight: '700',
                flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                padding: 0,
              }}
              onClick={() => startGame(n)}
            >
              <span style={{ fontSize: '28px' }}>{n}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>rounds</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Finished screen
  if (phase === 'finished' && gameResult !== 'tiebreak') {
    const playerWon = gameResult === 'player';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div className={`status-msg ${playerWon ? 'status-win' : 'status-lose'}`}>
          {playerWon ? '🏆 You win the match!' : '🤖 Bot wins the match!'}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px',
          background: 'var(--surface)', borderRadius: 'var(--radius-md)',
          padding: '20px 32px', border: '1px solid var(--border)', textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{playerWins}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>You</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-muted)' }}>{draws}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Draws</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{botWins}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bot</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={resetGame}>Play Again</button>
      </div>
    );
  }

  const isTiebreakPhase = phase === 'finished' && gameResult === 'tiebreak';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Score tracker */}
      <div style={{
        display: 'flex', gap: '0', marginBottom: '12px',
        background: 'var(--surface)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)', overflow: 'hidden',
        fontSize: '13px', fontWeight: '600',
      }}>
        <div style={{ padding: '8px 20px', borderRight: '1px solid var(--border)', color: '#10b981' }}>
          You: {playerWins}
        </div>
        <div style={{ padding: '8px 16px', borderRight: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {isTiebreakPhase ? '⚡ Sudden Death' : `Round ${roundsPlayed + (roundsLeft > 0 ? 1 : 0)} / ${totalRounds}`}
        </div>
        <div style={{ padding: '8px 20px', color: '#ef4444' }}>
          Bot: {botWins}
        </div>
      </div>

      {/* Round result */}
      <div className={`status-msg ${roundResultClass}`}>
        {isTiebreakPhase && !roundResult
          ? '⚡ Tiebreak! Next to win takes the match!'
          : roundResult || (roundsLeft > 0 ? `First to ${majority} wins!` : 'Make your choice!')}
      </div>

      {/* Choices display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '28px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>YOU</div>
          <div style={{
            width: '100px', height: '100px',
            background: 'var(--surface)',
            border: `2px solid ${roundResultClass === 'status-win' ? '#10b981' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '48px', boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.3s',
          }}>
            {playerChoice}
          </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-light)' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>BOT</div>
          <div style={{
            width: '100px', height: '100px',
            background: 'var(--surface)',
            border: `2px solid ${roundResultClass === 'status-lose' ? '#ef4444' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '48px', boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.3s',
          }}>
            {botChoice}
          </div>
        </div>
      </div>

      {/* Buttons */}
      {(roundsLeft > 0 || isTiebreakPhase) && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
          {CHOICES.map(c => (
            <button
              key={c}
              className="btn btn-secondary"
              style={{ width: '80px', height: '80px', fontSize: '36px', padding: 0, opacity: animating ? 0.5 : 1 }}
              onClick={() => isTiebreakPhase ? playTiebreak(c) : play(c)}
              disabled={animating}
            >
              {EMOJI[c]}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '300px', marginBottom: '16px' }}>
        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '99px',
            background: 'linear-gradient(90deg, #10b981, #06b6d4)',
            width: `${(roundsPlayed / totalRounds) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>{isTiebreakPhase ? 'All rounds played' : `${roundsLeft} round${roundsLeft !== 1 ? 's' : ''} left`}</span>
          <span>Need {majority} to win</span>
        </div>
      </div>

      {/* History */}
      <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: '100%', maxWidth: '300px' }}>
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Round History</h4>
        {history.length === 0
          ? <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>No rounds played yet.</p>
          : null
        }
        {history.slice(0, 6).map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px' }}>{h.p} vs {h.b}</span>
            <strong style={{ color: h.res === 'W' ? '#10b981' : h.res === 'L' ? '#ef4444' : '#f59e0b' }}>
              {h.res === 'W' ? 'Win' : h.res === 'L' ? 'Loss' : 'Draw'}
            </strong>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" onClick={resetGame} style={{ marginTop: '16px', fontSize: '13px', padding: '8px 20px' }}>
        ↩ Change Rounds
      </button>
    </div>
  );
}
