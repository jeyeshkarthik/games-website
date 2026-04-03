import { useState, useEffect, useCallback } from 'react';

const WORDS_BY_DIFFICULTY = {
  easy: ['CAT','DOG','SUN','HAT','RUN','CUP','BOX','MAP','NET','PAN','BIG','COW','FLY','GUN','HEN','JAR','KEY','LEG','MOP','NUT'],
  medium: ['PIANO','GRAPE','PLANE','CLOUD','DREAM','FLAME','GHOST','HONEY','JUNGLE','KNIFE','LEMON','MAGIC','NIGHT','OCEAN','PHONE','QUEEN','RIVER','STORM','TIGER','UNION'],
  hard: ['BLANKET','QUARTER','CRYSTAL','DORMANT','EXPRESS','FREIGHT','GLIMPSE','HARMONY','INSIGHT','JOURNEY','LAMPOON','MONARCH','NETWORK','OBSCURE','PATTERN','QUANTUM','RECRUIT','SILENCE','TRIUMPH','UNKNOWN'],
};

const MAX_WRONG = { easy: 6, medium: 6, hard: 6 };
const SCORE_BASE = { easy: 80, medium: 150, hard: 220 };
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function HangmanSVG({ wrong, maxWrong }) {
  const pct = wrong / maxWrong;
  const headColor = pct >= 0.8 ? '#ef4444' : 'var(--text-main)';
  return (
    <svg width="180" height="200" viewBox="0 0 180 200" style={{ margin: '8px 0' }}>
      {/* Gallows */}
      <line x1="20" y1="190" x2="160" y2="190" stroke="var(--text-muted)" strokeWidth="4" strokeLinecap="round"/>
      <line x1="55"  y1="190" x2="55"  y2="15"  stroke="var(--text-muted)" strokeWidth="4" strokeLinecap="round"/>
      <line x1="55"  y1="15"  x2="125" y2="15"  stroke="var(--text-muted)" strokeWidth="4" strokeLinecap="round"/>
      <line x1="125" y1="15"  x2="125" y2="38"  stroke="var(--text-muted)" strokeWidth="4" strokeLinecap="round"/>
      {/* Head */}
      {wrong >= 1 && <circle cx="125" cy="55" r="17" stroke={headColor} strokeWidth="3" fill="none"/>}
      {/* Eyes when dead */}
      {wrong >= maxWrong && <>
        <line x1="118" y1="50" x2="122" y2="54" stroke="#ef4444" strokeWidth="2"/>
        <line x1="122" y1="50" x2="118" y2="54" stroke="#ef4444" strokeWidth="2"/>
        <line x1="128" y1="50" x2="132" y2="54" stroke="#ef4444" strokeWidth="2"/>
        <line x1="132" y1="50" x2="128" y2="54" stroke="#ef4444" strokeWidth="2"/>
      </>}
      {/* Body */}
      {wrong >= 2 && <line x1="125" y1="72" x2="125" y2="130" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round"/>}
      {/* Left arm */}
      {wrong >= 3 && <line x1="125" y1="90" x2="100" y2="115" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round"/>}
      {/* Right arm */}
      {wrong >= 4 && <line x1="125" y1="90" x2="150" y2="115" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round"/>}
      {/* Left leg */}
      {wrong >= 5 && <line x1="125" y1="130" x2="100" y2="165" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round"/>}
      {/* Right leg */}
      {wrong >= 6 && <line x1="125" y1="130" x2="150" y2="165" stroke="var(--text-main)" strokeWidth="3" strokeLinecap="round"/>}
    </svg>
  );
}

export default function Hangman({ onGameOver, difficulty = 'medium' }) {
  const maxWrong = MAX_WRONG[difficulty] || 6;

  const newGame = useCallback(() => {
    const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY.medium;
    return {
      word: words[Math.floor(Math.random() * words.length)],
      guessed: new Set(),
      wrong: 0,
      gameOver: false,
      win: false,
    };
  }, [difficulty]);

  const [state, setState] = useState(() => newGame());
  const { word, guessed, wrong, gameOver, win } = state;

  useEffect(() => { setState(newGame()); }, [newGame]);

  const guess = useCallback((letter) => {
    setState(prev => {
      if (prev.gameOver || prev.guessed.has(letter)) return prev;
      const newGuessed = new Set(prev.guessed);
      newGuessed.add(letter);

      if (!prev.word.includes(letter)) {
        const newWrong = prev.wrong + 1;
        if (newWrong >= maxWrong) {
          return { ...prev, guessed: newGuessed, wrong: newWrong, gameOver: true, win: false };
        }
        return { ...prev, guessed: newGuessed, wrong: newWrong };
      } else {
        const allFound = prev.word.split('').every(c => newGuessed.has(c));
        if (allFound) {
          const base = SCORE_BASE[difficulty] || 150;
          const bonus = Math.max(0, (maxWrong - prev.wrong - 1) * 20);
          setTimeout(() => onGameOver(base + bonus), 300);
          return { ...prev, guessed: newGuessed, gameOver: true, win: true };
        }
        return { ...prev, guessed: newGuessed };
      }
    });
  }, [maxWrong, difficulty, onGameOver]);

  // Keyboard listener
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        guess(key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guess]);

  const restart = () => setState(newGame());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
      <div className={`status-msg ${win ? 'status-win' : gameOver ? 'status-lose' : ''}`}>
        {win ? '🎉 You got it!' : gameOver ? `😞 The word was "${word}"` : `Wrong guesses: ${wrong} / ${maxWrong}`}
      </div>

      <HangmanSVG wrong={wrong} maxWrong={maxWrong} />

      {/* Word blanks */}
      <div style={{ display: 'flex', gap: '6px', margin: '12px 0 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {word.split('').map((l, i) => (
          <div key={i} style={{
            width: '38px', height: '48px',
            borderBottom: `3px solid ${guessed.has(l) ? 'var(--accent)' : 'var(--border-hover)'}`,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            fontSize: '22px', fontWeight: '700',
            color: win && guessed.has(l) ? '#15803d' : gameOver && !guessed.has(l) ? '#ef4444' : 'var(--text-main)',
            transition: 'all 0.2s',
          }}>
            {guessed.has(l) || gameOver ? l : ''}
          </div>
        ))}
      </div>

      {/* Alphabet buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
        {ALPHABET.map(l => {
          const used = guessed.has(l);
          const correct = used && word.includes(l);
          const wrong_ = used && !word.includes(l);
          return (
            <button
              key={l}
              onClick={() => guess(l)}
              disabled={used || gameOver}
              style={{
                width: '36px', height: '36px', padding: 0,
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${correct ? '#86efac' : wrong_ ? '#fca5a5' : 'var(--border)'}`,
                background: correct ? 'var(--pastel-green)' : wrong_ ? '#fee2e2' : 'var(--surface)',
                color: correct ? '#15803d' : wrong_ ? '#991b1b' : 'var(--text-main)',
                fontWeight: '600', fontSize: '13px', cursor: used || gameOver ? 'default' : 'pointer',
                opacity: used ? 0.55 : 1,
                fontFamily: 'var(--font)',
                transition: 'all 0.15s',
              }}
            >
              {l}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
        💡 Tip: You can type letters on your keyboard!
      </p>

      {gameOver && (
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: '16px' }}>
          New Word
        </button>
      )}
    </div>
  );
}
