import { useState, useEffect, useCallback, useRef } from 'react';

const WORDS_BY_DIFFICULTY = {
  easy: ['CHAIR','BREAD','FLAME','GRACE','JUICE','KNIFE','LEMON','MANGO','NOBLE','OCEAN','PEACE','QUEEN','RIVER','SMILE','TIGER','UNCLE','VIVID','XENON','YACHT','ARROW'],
  medium: ['BLAND','CRIMP','BLAZE','CLASP','DEPOT','FROST','GLINT','HARSH','INFER','JOUST','KNACK','LUSTY','MAXIM','OPTIC','PRISM','QUIRK','RIVET','STOMP','TRAMP','WALTZ'],
  hard: ['CRYPT','GLYPH','LYMPH','MYRRH','PROXY','PYGMY','SYNTH','TRYST','VYING','BRISK','CRISP','DWARF','EXPEL','FJORD','GRUMP','HEXED','IRKED','JAZZY','KNELT','SCAMP'],
};

const KEYS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Enter','Z','X','C','V','B','N','M','⌫'],
];

const MAX_GUESSES = { easy: 7, medium: 6, hard: 5 };
const SCORE_BASE = { easy: 80, medium: 100, hard: 130 };

export default function Wordle({ onGameOver, difficulty = 'medium' }) {
  const maxGuesses = MAX_GUESSES[difficulty] || 6;
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  const newGame = useCallback(() => {
    const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY.medium;
    return {
      targetWord: words[Math.floor(Math.random() * words.length)],
      guesses: [],
      currentGuess: '',
      gameOver: false,
      win: false,
    };
  }, [difficulty]);

  const [state, setState] = useState(() => newGame());
  const { targetWord, guesses, currentGuess, gameOver, win } = state;

  useEffect(() => { setState(newGame()); }, [newGame]);

  const submitGuess = useCallback((guess, currentGuesses, target) => {
    if (guess.length !== 5) return;
    const newGuesses = [...currentGuesses, guess];
    const isWin = guess === target;
    const isLose = !isWin && newGuesses.length >= maxGuesses;

    setState(prev => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: '',
      gameOver: isWin || isLose,
      win: isWin,
    }));

    if (isWin) {
      const base = SCORE_BASE[difficulty] || 100;
      const bonus = Math.max(0, (maxGuesses - newGuesses.length) * 15);
      const finalScore = base + bonus;
      setTimeout(() => onGameOverRef.current(finalScore), 500);
    }
  }, [maxGuesses, difficulty]);

  const handleKey = useCallback((key) => {
    setState(prev => {
      if (prev.gameOver) return prev;
      if (key === '⌫' || key === 'Backspace') {
        return { ...prev, currentGuess: prev.currentGuess.slice(0, -1) };
      }
      if (key === 'Enter') {
        if (prev.currentGuess.length === 5) {
          // Trigger submit outside setState
          return prev; // handled below via ref
        }
        return prev;
      }
      if (prev.currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
        return { ...prev, currentGuess: prev.currentGuess + key };
      }
      return prev;
    });
  }, []);

  // We need a separate ref-based submit to avoid closure issues
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const handleKeyWithSubmit = useCallback((key) => {
    if (key === 'Enter') {
      const { currentGuess: cg, guesses: gs, targetWord: tw, gameOver: go } = stateRef.current;
      if (!go && cg.length === 5) {
        submitGuess(cg, gs, tw);
      }
      return;
    }
    handleKey(key);
  }, [handleKey, submitGuess]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      let key = e.key;
      if (key.length === 1 && /[a-zA-Z]/.test(key)) key = key.toUpperCase();
      if (['Enter', 'Backspace'].includes(key) || /^[A-Z]$/.test(key)) {
        e.preventDefault();
        handleKeyWithSubmit(key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyWithSubmit]);

  const getLetterStatus = (letter, i) => {
    if (targetWord[i] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const getKeyStatus = () => {
    const status = {};
    guesses.forEach(g => {
      g.split('').forEach((letter, i) => {
        const cur = getLetterStatus(letter, i);
        if (cur === 'correct') status[letter] = 'correct';
        else if (cur === 'present' && status[letter] !== 'correct') status[letter] = 'present';
        else if (cur === 'absent' && !status[letter]) status[letter] = 'absent';
      });
    });
    return status;
  };

  const kbStatus = getKeyStatus();
  const restart = () => setState(newGame());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '420px' }}>
      <div style={{ marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {maxGuesses} attempts · {difficulty}
      </div>

      <div className={`status-msg ${win ? 'status-win' : gameOver ? 'status-lose' : ''}`}>
        {win ? `🎉 Got it in ${guesses.length}!` : gameOver ? `😞 Word was "${targetWord}"` : 'Guess the 5-letter word'}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateRows: `repeat(${maxGuesses}, 1fr)`, gap: '7px', margin: '16px 0 24px', width: '100%', maxWidth: '310px' }}>
        {Array.from({ length: maxGuesses }).map((_, r) => {
          const g = guesses[r] || (r === guesses.length ? currentGuess : '');
          const submitted = r < guesses.length;
          return (
            <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '7px' }}>
              {Array.from({ length: 5 }).map((_, c) => {
                const letter = g[c] || '';
                let bg = 'var(--surface)', borderColor = 'var(--border)', color = 'var(--text-main)';
                if (submitted && letter) {
                  const s = getLetterStatus(letter, c);
                  if (s === 'correct') { bg = '#dcfce7'; borderColor = '#86efac'; color = '#15803d'; }
                  if (s === 'present') { bg = '#ffedd5'; borderColor = '#fcd34d'; color = '#b45309'; }
                  if (s === 'absent')  { bg = 'var(--bg-tertiary)'; borderColor = 'var(--border-hover)'; color = 'var(--text-muted)'; }
                }
                const isActive = r === guesses.length && !submitted;
                const hasBorder = letter && isActive ? 'var(--accent)' : submitted && letter ? borderColor : 'var(--border)';
                return (
                  <div key={c} style={{
                    aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${hasBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', fontWeight: 'bold',
                    background: bg, color,
                    transform: isActive && letter ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.1s ease',
                    animation: submitted && letter ? `flipIn 0.3s ease ${c * 0.08}s both` : 'none',
                  }}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
        {KEYS.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {row.map(key => {
              const s = kbStatus[key];
              let bg = 'var(--surface)', color = 'var(--text-main)';
              if (s === 'correct') { bg = '#dcfce7'; color = '#15803d'; }
              if (s === 'present') { bg = '#ffedd5'; color = '#b45309'; }
              if (s === 'absent')  { bg = 'var(--bg-tertiary)'; color = 'var(--text-muted)'; }
              return (
                <button
                  key={key}
                  onClick={() => handleKeyWithSubmit(key)}
                  style={{
                    padding: key.length > 1 ? '12px 8px' : '12px 0',
                    width: key.length > 1 ? '62px' : '34px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: bg, color,
                    fontWeight: '700', cursor: 'pointer',
                    fontSize: key.length > 1 ? '11px' : '14px',
                    fontFamily: 'var(--font)',
                    transition: 'background 0.2s',
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: '24px' }}>
          Play Again
        </button>
      )}
    </div>
  );
}
