import { useState, useEffect } from 'react';

const EMOJIS = ['🦊','🐻','🦁','🐯','🦄','🐸','🐙','🦋'];

export default function MemoryMatch({ onGameOver }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGame = () => {
    const pairEmojis = [...EMOJIS, ...EMOJIS];
    // Shuffle
    for(let i=pairEmojis.length-1; i>0; i--){
      const j=Math.floor(Math.random()*(i+1));
      [pairEmojis[i], pairEmojis[j]] = [pairEmojis[j], pairEmojis[i]];
    }
    setCards(pairEmojis);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameOver(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const flip = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first] === cards[second]) {
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === cards.length) {
          setGameOver(true);
          // Score = 200 - moves (so less moves = higher score)
          onGameOver(Math.max(10, 200 - moves));
        }
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div className="status-msg">
        {gameOver ? '🎉 You Won!' : `Pairs: ${matched.length/2}/8 | Moves: ${moves}`}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        {cards.map((emoji, i) => {
          const isFlipped = flipped.includes(i) || matched.includes(i);
          return (
            <div 
              key={i}
              onClick={() => flip(i)}
              style={{
                width: '70px', height: '70px',
                borderRadius: 'var(--radius-md)',
                background: isFlipped ? (matched.includes(i) ? 'var(--pastel-green)' : '#fff') : 'var(--pastel-purple)',
                border: `2px solid ${isFlipped ? (matched.includes(i) ? '#86efac' : 'var(--border)') : 'var(--pastel-purple-strong)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', cursor: 'pointer',
                transition: 'all 0.3s transform ease',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)'
              }}
            >
              <div style={{ transform: isFlipped ? 'rotateY(180deg)' : 'none' }}>
                {isFlipped ? emoji : '❓'}
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary" onClick={initGame}>Restart</button>
    </div>
  );
}
