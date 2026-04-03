import { useState, useRef } from 'react';

const ROWS = 6, COLS = 7;

export default function ConnectFour({ onGameOver }) {
  const [board, setBoard] = useState(Array.from({length:ROWS}, ()=>Array(COLS).fill(0)));
  const [gameOver, setGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState('Your turn — click a column');
  const [statusClass, setStatusClass] = useState('');
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); // Always-current score for callbacks

  const checkWin = (b, p) => {
    // Horizontal
    for(let r=0;r<ROWS;r++) for(let c=0;c<=COLS-4;c++) if([0,1,2,3].every(i=>b[r][c+i]===p)) return true;
    // Vertical
    for(let r=0;r<=ROWS-4;r++) for(let c=0;c<COLS;c++) if([0,1,2,3].every(i=>b[r+i][c]===p)) return true;
    // Diagonal \
    for(let r=0;r<=ROWS-4;r++) for(let c=0;c<=COLS-4;c++) if([0,1,2,3].every(i=>b[r+i][c+i]===p)) return true;
    // Diagonal /
    for(let r=3;r<ROWS;r++) for(let c=0;c<=COLS-4;c++) if([0,1,2,3].every(i=>b[r-i][c+i]===p)) return true;
    return false;
  };

  const isDraw = (b) => b[0].every(v=>v!==0);

  const getRow = (b, col) => {
    for (let r=ROWS-1;r>=0;r--) if (!b[r][col]) return r;
    return -1;
  };

  const botMove = (currentBoard) => {
    // Try to win
    for (let c=0;c<COLS;c++) {
      const r=getRow(currentBoard, c); if(r<0) continue;
      currentBoard[r][c]=2; if(checkWin(currentBoard,2)){currentBoard[r][c]=0;return c;} currentBoard[r][c]=0;
    }
    // Block player win
    for (let c=0;c<COLS;c++) {
      const r=getRow(currentBoard, c); if(r<0) continue;
      currentBoard[r][c]=1; if(checkWin(currentBoard,1)){currentBoard[r][c]=0;return c;} currentBoard[r][c]=0;
    }
    // Prefer center
    const preferred=[3,2,4,1,5,0,6];
    for (const c of preferred) { if(getRow(currentBoard,c)>=0) return c; }
    return 0;
  };

  const drop = (col) => {
    if (gameOver || !isPlayerTurn) return;
    const row = getRow(board, col);
    if (row < 0) return;

    // Lock player input immediately
    setIsPlayerTurn(false);

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    setBoard(newBoard);

    if (checkWin(newBoard, 1)) {
      const newScore = scoreRef.current + 100;
      scoreRef.current = newScore;
      setScore(newScore);
      setGameOver(true); setStatus('🎉 You win!'); setStatusClass('status-win');
      onGameOver(newScore);
      return;
    }
    if (isDraw(newBoard)) {
      const newScore = scoreRef.current + 50;
      scoreRef.current = newScore;
      setScore(newScore);
      setGameOver(true); setStatus("🤝 It's a draw!"); setStatusClass('status-draw');
      onGameOver(newScore);
      return;
    }

    setStatus('🤖 Bot is thinking...');

    setTimeout(() => {
      const bc = getBotMoveCol(newBoard);
      const br = getRow(newBoard, bc);
      newBoard[br][bc] = 2;
      setBoard([...newBoard]);

      if (checkWin(newBoard, 2)) {
        setGameOver(true); setStatus('🤖 Bot wins!'); setStatusClass('status-lose');
        return;
      }
      if (isDraw(newBoard)) {
        const newScore = scoreRef.current + 50;
        scoreRef.current = newScore;
        setScore(newScore);
        setGameOver(true); setStatus("🤝 It's a draw!"); setStatusClass('status-draw');
        onGameOver(newScore);
        return;
      }
      // Unlock player input
      setIsPlayerTurn(true);
      setStatus('Your turn — click a column');
    }, 500);
  };

  const getBotMoveCol = (b) => botMove(b);

  const reset = () => {
    setBoard(Array.from({length:ROWS}, ()=>Array(COLS).fill(0)));
    setGameOver(false);
    setIsPlayerTurn(true);
    setStatus('Your turn — click a column');
    setStatusClass('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={`status-msg ${statusClass}`}>{status}</div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
        <strong>Current Score Session: {score}</strong>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {Array.from({length: COLS}).map((_, c) => (
          <button
            key={c}
            className="btn btn-secondary"
            style={{ padding: '4px 12px', opacity: (!isPlayerTurn || gameOver) ? 0.4 : 1, cursor: (!isPlayerTurn || gameOver) ? 'default' : 'pointer' }}
            onClick={() => drop(c)}
            disabled={!isPlayerTurn || gameOver}
          >▼</button>
        ))}
      </div>
      
      <div style={{ background: 'var(--pastel-blue)', padding: '16px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '2px solid var(--pastel-purple)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '8px' }}>
          {board.flat().map((v, i) => (
            <div 
              key={i}
              style={{
                width: '50px', height: '50px', borderRadius: '50%',
                background: v === 1 ? '#fbbf24' : v === 2 ? 'var(--accent)' : '#fff',
                border: '2px solid rgba(0,0,0,0.05)',
                boxShadow: v !== 0 ? 'inset 0 0 10px rgba(0,0,0,0.1)' : 'inset 0 4px 6px rgba(0,0,0,0.05)',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>
      </div>
      
      <button className="btn btn-primary" onClick={reset} style={{ marginTop: '24px' }}>New Game</button>
    </div>
  );
}
