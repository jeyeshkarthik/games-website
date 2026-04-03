import { useState, useEffect, useRef } from 'react';

const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWin(b) {
  for (const [a, c, d] of WINS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line: [a, c, d] };
  }
  if (b.every(v => v)) return { winner: 'draw', line: [] };
  return null;
}

function minimax(b, depth, isMax) {
  const res = checkWin(b);
  if (res?.winner === 'O') return 10 - depth;
  if (res?.winner === 'X') return depth - 10;
  if (res?.winner === 'draw') return 0;
  if (isMax) {
    let best = -Infinity;
    b.forEach((v, i) => { if (!v) { b[i] = 'O'; best = Math.max(best, minimax(b, depth + 1, false)); b[i] = null; } });
    return best;
  } else {
    let best = Infinity;
    b.forEach((v, i) => { if (!v) { b[i] = 'X'; best = Math.min(best, minimax(b, depth + 1, true)); b[i] = null; } });
    return best;
  }
}

function getBotMove(board) {
  let bestScore = -Infinity, move;
  board.forEach((v, i) => {
    if (!v) {
      board[i] = 'O';
      const s = minimax(board, 0, false);
      board[i] = null;
      if (s > bestScore) { bestScore = s; move = i; }
    }
  });
  return move;
}

export default function TicTacToe({ onGameOver }) {
  // Track which player starts each round — randomly pick for game 1, then alternate
  const nextStarterRef = useRef(Math.random() < 0.5 ? 'player' : 'bot');

  const initRound = () => {
    const starter = nextStarterRef.current;
    return {
      board: Array(9).fill(null),
      isPlayerTurn: starter === 'player',
      gameOver: false,
      status: starter === 'player' ? '🔵 Your turn — play X' : '🤖 Bot goes first...',
      statusClass: '',
      winLine: [],
      starter,
    };
  };

  const [state, setState] = useState(initRound);
  const [score, setScore] = useState(0);
  const { board, isPlayerTurn, gameOver, status, statusClass, winLine, starter } = state;

  // AI move effect — fires whenever it's the bot's turn
  useEffect(() => {
    const result = checkWin(board);

    if (result) {
      const isWin = result.winner === 'X';
      const isDraw = result.winner === 'draw';
      setState(prev => ({
        ...prev,
        gameOver: true,
        winLine: result.line,
        status: isWin ? '🎉 You win!' : isDraw ? "🤝 It's a draw!" : '🤖 Bot wins!',
        statusClass: isWin ? 'status-win' : isDraw ? 'status-draw' : 'status-lose',
      }));
      if (isWin) { const s = score + 100; setScore(s); onGameOver(s); }
      if (isDraw) { const s = score + 50; setScore(s); onGameOver(s); }
      return;
    }

    if (!isPlayerTurn && !gameOver) {
      setState(prev => ({ ...prev, status: '🤖 Bot is thinking...' }));
      const timer = setTimeout(() => {
        const botIndex = getBotMove([...board]);
        if (botIndex !== undefined) {
          const newBoard = [...board];
          newBoard[botIndex] = 'O';
          setState(prev => ({
            ...prev,
            board: newBoard,
            isPlayerTurn: true,
            status: '🔵 Your turn — play X',
          }));
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [board, isPlayerTurn, gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const playerMove = (i) => {
    if (gameOver || board[i] || !isPlayerTurn) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setState(prev => ({ ...prev, board: newBoard, isPlayerTurn: false }));
  };

  const nextRound = () => {
    // Flip starter for next round
    nextStarterRef.current = starter === 'player' ? 'bot' : 'player';
    setState(initRound());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Who starts badge */}
      <div style={{
        fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
      }}>
        {starter === 'player' ? '🔵 You start this round' : '🤖 Bot starts this round'}
      </div>

      <div className={`status-msg ${statusClass}`}>{status}</div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <strong>Session Score: {score}</strong>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
        background: 'var(--surface)', padding: '20px',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)',
      }}>
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
              fontSize: '48px', fontWeight: 'bold',
              color: v === 'X' ? 'var(--accent)' : '#0d9488',
              cursor: (!v && !gameOver && isPlayerTurn) ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            {v === 'X' ? '✖' : v === 'O' ? '◯' : ''}
          </div>
        ))}
      </div>

      <button className="btn btn-primary" onClick={nextRound} style={{ marginTop: '24px' }}>
        Next Round
      </button>
    </div>
  );
}
