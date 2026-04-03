import { useState, useEffect, useCallback } from 'react';

const WORDS_BY_DIFFICULTY = {
  easy: ['CHAIR','BREAD','FLAME','GRACE','JUICE','KNIFE','LEMON','MANGO','NOBLE','OCEAN','PEACE','QUEEN','RIVER','SMILE','TIGER','UNCLE','VIVID','WILLOW','XENON','YACHT'].filter(w => w.length === 5),
  medium: ['BLAND','CRIMP','DROSS','BLAZE','CLASP','DEPOT','FROST','GLINT','HARSH','INFER','JOUST','KNACK','LUSTY','MAXIM','NYMPH','OPTIC','PRISM','QUIRK','RIVET','STOMP'],
  hard: ['CRYPT','GLYPH','LYMPH','MYRRH','NYMPH','PROXY','PYGMY','SYNTH','TRYST','VYING','BRISK','CRISP','DWARF','EXPEL','FJORD','GRUMP','HEXED','IRKED','JAZZY','KNELT'],
};

const KEYS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Enter','Z','X','C','V','B','N','M','⌫']
];

const MAX_GUESSES_BY_DIFFICULTY = { easy: 7, medium: 6, hard: 5 };
const SCORE_BY_DIFFICULTY = { easy: 80, medium: 100, hard: 130 };

export default function Wordle({ onGameOver, difficulty = 'medium' }) {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const maxGuesses = MAX_GUESSES_BY_DIFFICULTY[difficulty] || 6;

  const initGame = useCallback(() => {
    const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY.medium;
    setTargetWord(words[Math.floor(Math.random() * words.length)]);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWin(false);
  }, [difficulty]);

  useEffect(() => { initGame(); }, [initGame]);

  const submitGuess = useCallback((guess, currentGuesses) => {
    if (guess.length !== 5) return;
    const newGuesses = [...currentGuesses, guess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (guess === targetWord) {
      setGameOver(true);
      setWin(true);
      const base = SCORE_BY_DIFFICULTY[difficulty] || 100;
      const bonus = Math.max(0, (maxGuesses - newGuesses.length) * 15);
      setTimeout(() => onGameOver(base + bonus), 400);
    } else if (newGuesses.length >= maxGuesses) {
      setGameOver(true);
    }
  }, [targetWord, difficulty, maxGuesses, onGameOver]);

  const handleKey = useCallback((key) => {
    if (gameOver) return;
    if (key === '⌫' || key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'Enter') {
      if (currentGuess.length === 5) {
        submitGuess(currentGuess, guesses);
      }
    } else if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  }, [gameOver, currentGuess, guesses, submitGuess]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      let key = e.key;
      if (key.length === 1 && /[a-zA-Z]/.test(key)) key = key.toUpperCase();
      if (['Enter','Backspace','⌫'].includes(key) || /^[A-Z]$/.test(key)) {
        e.preventDefault();
        handleKey(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKey]);

  const getLetterStatus = (letter, i) => {
    if (targetWord[i] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const getKeyboardStatus = () => {
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

  const kbStatus = getKeyboardStatus();

  const diffColors = { easy: '#86efac', medium: '#fcd34d', hard: '#fca5a5' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '420px' }}>
      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {maxGuesses} attempts · {difficulty}
      </div>

      <div className={`status-msg ${win ? 'status-win' : gameOver ? 'status-lose' : ''}`}>
        {win ? '🎉 You got it!' : gameOver ? `😞 The word was ${targetWord}` : 'Type a 5-letter word & press Enter'}
      </div>

      <div style={{ display: 'grid', gridTemplateRows: `repeat(${maxGuesses}, 1fr)`, gap: '8px', marginBottom: '32px', width: '100%', maxWidth: '310px' }}>
        {Array.from({ length: maxGuesses }).map((_, r) => {
          const guess = guesses[r] || (r === guesses.length ? currentGuess : '');
          const isSubmitted = r < guesses.length;
          return (
            <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {Array.from({ length: 5 }).map((_, c) => {
                const letter = guess[c] || '';
                let bg = 'var(--surface)', borderColor = 'var(--border)', color = 'var(--text-main)';
                if (isSubmitted && letter) {
                  const s = getLetterStatus(letter, c);
                  if (s === 'correct') { bg = 'var(--pastel-green)'; borderColor = '#86efac'; color = '#15803d'; }
                  if (s === 'present') { bg = 'var(--pastel-orange)'; borderColor = '#fcd34d'; color = '#b45309'; }
                  if (s === 'absent') { bg = 'var(--bg-tertiary)'; borderColor = 'var(--border-hover)'; color = 'var(--text-muted)'; }
                }
                const isActive = r === guesses.length && !isSubmitted;
                return (
                  <div key={c} style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${letter && isActive ? 'var(--accent)' : isSubmitted && letter ? borderColor : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', fontWeight: 'bold',
                    background: bg, color,
                    transform: isActive && letter ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.1s ease',
                  }}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {KEYS.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
            {row.map(key => {
              const s = kbStatus[key];
              let bg = 'var(--surface)', color = 'var(--text-main)';
              if (s === 'correct') { bg = 'var(--pastel-green)'; color = '#15803d'; }
              if (s === 'present') { bg = 'var(--pastel-orange)'; color = '#b45309'; }
              if (s === 'absent') { bg = 'var(--bg-tertiary)'; color = 'var(--text-muted)'; }
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  style={{
                    padding: key.length > 1 ? '12px 10px' : '12px 0',
                    width: key.length > 1 ? '64px' : '36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: bg, color,
                    fontWeight: 'bold', cursor: 'pointer',
                    fontSize: key.length > 1 ? '11px' : '14px',
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
        <button className="btn btn-primary" onClick={initGame} style={{ marginTop: '24px' }}>
          Play Again
        </button>
      )}
    </div>
  );
}
