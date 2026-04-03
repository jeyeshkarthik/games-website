import { useState, useRef, useCallback, useEffect } from 'react';

const ROWS = 6, COLS = 7;

function checkWin(b, p) {
  // Horizontal
  for(let r=0;r<ROWS;r++) for(let c=0;c<=COLS-4;c++) if([0,1,2,3].every(i=>b[r][c+i]===p)) return true;
  // Vertical
  for(let r=0;r<=ROWS-4;r++) for(let c=0;c<COLS;c++) if([0,1,2,3].every(i=>b[r+i][c]===p)) return true;
  // Diagonal \
  for(let r=0;r<=ROWS-4;r++) for(let c=0;c<=COLS-4;c++) if([0,1,2,3].every(i=>b[r+i][c+i]===p)) return true;
  // Diagonal /
  for(let r=3;r<ROWS;r++) for(let c=0;c<=COLS-4;c++) if([0,1,2,3].every(i=>b[r-i][c+i]===p)) return true;
  return false;
}

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

export default function ConnectFour({ onGameOver }) {
  const nextStarterRef = useRef(Math.random() < 0.5 ? 'player' : 'bot');
  
  const initRound = () => {
    const starter = nextStarterRef.current;
    return {
      board: Array.from({length:ROWS}, ()=>Array(COLS).fill(0)),
      gameOver: false,
      isPlayerTurn: starter === 'player',
      status: starter === 'player' ? 'Your turn — click a column' : '🤖 Bot goes first...',
      statusClass: '',
      starter
    };
  };

  const [state, setState] = useState(initRound);
  const { board, gameOver, isPlayerTurn, status, statusClass, starter } = state;
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  
  // Ref to track if we've already triggered the AI for its first turn
  const initialBotMoveTriggered = useRef(false);

  // Trigger bot move
  const runBot = useCallback((currentBoard) => {
    setState(prev => ({ ...prev, status: '🤖 Bot is thinking...' }));
    
    setTimeout(() => {
      const bc = botMove(currentBoard);
      const br = getRow(currentBoard, bc);
      if (br < 0) return; // Should not happen

      const newBoard = currentBoard.map(r => [...r]);
      newBoard[br][bc] = 2;
      
      if (checkWin(newBoard, 2)) {
        setState(prev => ({ ...prev, board: newBoard, gameOver: true, status: '🤖 Bot wins!', statusClass: 'status-lose' }));
        return;
      }
      if (isDraw(newBoard)) {
        const newScore = scoreRef.current + 50;
        scoreRef.current = newScore;
        setScore(newScore);
        setState(prev => ({ ...prev, board: newBoard, gameOver: true, status: "🤝 It's a draw!", statusClass: 'status-draw' }));
        onGameOver(newScore);
        return;
      }
      
      setState(prev => ({ ...prev, board: newBoard, isPlayerTurn: true, status: 'Your turn — click a column' }));
    }, 500);
  }, [onGameOver]);

  // Handle first turn if it's bot
  useEffect(() => {
    if (starter === 'bot' && !isPlayerTurn && !initialBotMoveTriggered.current) {
      initialBotMoveTriggered.current = true; // Mark as done
      runBot(board);
    }
  }, [starter, isPlayerTurn, board, runBot]);

  const drop = (col) => {
    if (gameOver || !isPlayerTurn) return;
    const row = getRow(board, col);
    if (row < 0) return;

    // Lock player input immediately
    setState(prev => ({ ...prev, isPlayerTurn: false }));

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 1;
    
    if (checkWin(newBoard, 1)) {
      const newScore = scoreRef.current + 100;
      scoreRef.current = newScore;
      setScore(newScore);
      setState(prev => ({ ...prev, board: newBoard, gameOver: true, status: '🎉 You win!', statusClass: 'status-win' }));
      onGameOver(newScore);
      return;
    }
    if (isDraw(newBoard)) {
      const newScore = scoreRef.current + 50;
      scoreRef.current = newScore;
      setScore(newScore);
      setState(prev => ({ ...prev, board: newBoard, gameOver: true, status: "🤝 It's a draw!", statusClass: 'status-draw' }));
      onGameOver(newScore);
      return;
    }

    setState(prev => ({ ...prev, board: newBoard }));
    runBot(newBoard);
  };

  const nextRound = () => {
    nextStarterRef.current = starter === 'player' ? 'bot' : 'player';
    initialBotMoveTriggered.current = false;
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
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
        <strong>Session Score: {score}</strong>
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
      
      <button className="btn btn-primary" onClick={nextRound} style={{ marginTop: '24px' }}>
        Next Round
      </button>
    </div>
  );
}
