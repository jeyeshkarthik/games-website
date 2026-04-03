import { useState, useEffect } from 'react';

const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

export default function TicTacToe({ onGameOver }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('Your turn — play X');
  const [statusClass, setStatusClass] = useState('');
  const [winLine, setWinLine] = useState([]);
  
  // Actually we need to track points across sessions for Tic Tac Toe?
  // Let's say +100 points for a win, +50 for draw
  const [score, setScore] = useState(0);

  const checkWin = (b) => {
    for (const [a,c,d] of wins) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line: [a,c,d] };
    }
    if (b.every(v => v)) return { winner: 'draw', line: [] };
    return null;
  };

  const minimax = (b, depth, isMax) => {
    const res = checkWin(b);
    if (res?.winner === 'O') return 10 - depth;
    if (res?.winner === 'X') return depth - 10;
    if (res?.winner === 'draw') return 0;

    if (isMax) {
      let best = -Infinity;
      b.forEach((v, i) => {
        if (!v) { b[i] = 'O'; best = Math.max(best, minimax(b, depth + 1, false)); b[i] = null; }
      });
      return best;
    } else {
      let best = Infinity;
      b.forEach((v, i) => {
        if (!v) { b[i] = 'X'; best = Math.min(best, minimax(b, depth + 1, true)); b[i] = null; }
      });
      return best;
    }
  };

  const getBotMove = (currentBoard) => {
    let bestScore = -Infinity;
    let move;
    currentBoard.forEach((v, i) => {
      if (!v) {
        currentBoard[i] = 'O';
        const s = minimax(currentBoard, 0, false);
        currentBoard[i] = null;
        if (s > bestScore) { bestScore = s; move = i; }
      }
    });
    return move;
  };

  const playerMove = (i) => {
    if (gameOver || board[i] || !isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  useEffect(() => {
    const result = checkWin(board);
    if (result) {
      setGameOver(true);
      setWinLine(result.line);
      if (result.winner === 'X') {
        setStatus('🎉 You win!');
        setStatusClass('status-win');
        setScore(pre => pre + 100);
        onGameOver(score + 100);
      } else if (result.winner === 'O') {
        setStatus('🤖 Bot wins!');
        setStatusClass('status-lose');
      } else {
        setStatus("🤝 It's a draw!");
        setStatusClass('status-draw');
        setScore(pre => pre + 50);
        onGameOver(score + 50);
      }
      return;
    }

    if (!isPlayerTurn && !gameOver) {
      setStatus('🤖 Bot is thinking...');
      const timer = setTimeout(() => {
        const botIndex = getBotMove([...board]);
        if (botIndex !== undefined) {
          const newBoard = [...board];
          newBoard[botIndex] = 'O';
          setBoard(newBoard);
          setIsPlayerTurn(true);
          setStatus('Your turn — play X');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [board, isPlayerTurn]);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setIsPlayerTurn(true);
    setStatus('Your turn — play X');
    setStatusClass('');
    setWinLine([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={`status-msg ${statusClass}`}>{status}</div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <strong>Current Score Session: {score}</strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        {board.map((v, i) => (
          <div 
            key={i}
            onClick={() => playerMove(i)}
            style={{
              width: '80px', height: '80px',
              background: winLine.includes(i) ? 'var(--pastel-green)' : 'var(--bg-primary)',
              border: `2px solid ${v === 'X' ? 'var(--accent)' : v === 'O' ? 'var(--pastel-teal-strong)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '48px', fontWeight: 'bold', color: v === 'X' ? 'var(--accent)' : '#0d9488',
              cursor: (!v && !gameOver && isPlayerTurn) ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
          >
            {v === 'X' ? '✖' : v === 'O' ? '◯' : ''}
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={reset} style={{ marginTop: '24px' }}>
        Next Round
      </button>
    </div>
  );
}
