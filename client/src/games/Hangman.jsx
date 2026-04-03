import { useState, useEffect } from 'react';

const WORDS = ['REACT', 'PASTEL', 'EXPRESS', 'DATABASE', 'VITE'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Hangman({ onGameOver }) {
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState(new Set());
  const [wrong, setWrong] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  const initGame = () => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuessed(new Set());
    setWrong(0);
    setGameOver(false);
    setWin(false);
  };

  useEffect(() => { initGame(); }, []);

  const guess = (l) => {
    if (gameOver || guessed.has(l)) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(l);
    setGuessed(newGuessed);

    if (!word.includes(l)) {
      const newWrong = wrong + 1;
      setWrong(newWrong);
      if (newWrong >= 6) {
        setGameOver(true);
      }
    } else {
      const allFound = word.split('').every(char => newGuessed.has(char));
      if (allFound) {
        setWin(true);
        setGameOver(true);
        onGameOver(200 - (wrong * 20));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
      <div className={`status-msg ${win ? 'status-win' : gameOver ? 'status-lose' : ''}`}>
        {win ? '🎉 You got it!' : gameOver ? `😞 Word was ${word}` : `Wrong guesses: ${wrong}/6`}
      </div>

      <div style={{ display: 'flex', gap: '8px', margin: '32px 0' }}>
        {word.split('').map((l, i) => (
          <div key={i} style={{
            width: '40px', height: '50px', borderBottom: '3px solid var(--accent)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold'
          }}>
            {guessed.has(l) || gameOver ? l : ''}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {ALPHABET.map(l => (
          <button 
            key={l} 
            onClick={() => guess(l)}
            disabled={guessed.has(l) || gameOver}
            className="btn btn-secondary" 
            style={{ 
              width: '40px', height: '40px', padding: 0, 
              opacity: guessed.has(l) ? 0.4 : 1,
              background: guessed.has(l) ? (word.includes(l) ? 'var(--pastel-green)' : 'var(--pastel-pink)') : 'var(--surface)'
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {gameOver && <button className="btn btn-primary" onClick={initGame} style={{ marginTop: '32px' }}>Next Word</button>}
    </div>
  );
}
