import { useState, useEffect } from 'react';

const ROWS = 9, COLS = 9, MINES = 10;

export default function Minesweeper({ onGameOver }) {
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [score, setScore] = useState(0);

  const initGame = () => {
    setGrid(Array.from({length:ROWS},()=>Array(COLS).fill(0)));
    setRevealed(Array.from({length:ROWS},()=>Array(COLS).fill(false)));
    setFlagged(Array.from({length:ROWS},()=>Array(COLS).fill(false)));
    setGameOver(false); setWin(false); setFirstClick(true);
  };

  useEffect(() => { initGame(); }, []);

  const placeMines = (firstR, firstC, currentGrid) => {
    let placed=0;
    while(placed<MINES) {
      const r=Math.floor(Math.random()*ROWS), c=Math.floor(Math.random()*COLS);
      if(currentGrid[r][c]===-1) continue;
      if(Math.abs(r-firstR)<=1 && Math.abs(c-firstC)<=1) continue;
      currentGrid[r][c]=-1; placed++;
    }
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
      if(currentGrid[r][c]===-1) continue;
      let cnt=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) {
        if(r+dr>=0&&r+dr<ROWS&&c+dc>=0&&c+dc<COLS&&currentGrid[r+dr][c+dc]===-1) cnt++;
      }
      currentGrid[r][c]=cnt;
    }
  };

  const floodReveal = (r, c, currentRevealed, currentGrid) => {
    if(r<0||r>=ROWS||c<0||c>=COLS||currentRevealed[r][c]||flagged[r][c]) return;
    currentRevealed[r][c]=true;
    if(currentGrid[r][c]===0) {
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) floodReveal(r+dr,c+dc, currentRevealed, currentGrid);
    }
  };

  const click = (r, c) => {
    if(gameOver || revealed[r][c] || flagged[r][c]) return;
    
    let currentGrid = [...grid.map(row => [...row])];
    let currentRevealed = [...revealed.map(row => [...row])];
    
    if(firstClick) {
      placeMines(r, c, currentGrid);
      setFirstClick(false);
      setGrid(currentGrid);
    }
    
    if(currentGrid[r][c] === -1) {
      // Explode
      currentGrid.forEach((row, ri) => row.forEach((val, ci) => {
        if(val === -1) currentRevealed[ri][ci] = true;
      }));
      setRevealed(currentRevealed);
      setGameOver(true);
      return;
    }
    
    floodReveal(r, c, currentRevealed, currentGrid);
    setRevealed(currentRevealed);
    
    // Check Win
    let revCount = 0;
    currentRevealed.forEach(row => row.forEach(val => { if (val) revCount++; }));
    if(revCount === (ROWS * COLS) - MINES) {
      setGameOver(true);
      setWin(true);
      const gameScore = 500; // Base score for easy
      setScore(gameScore);
      onGameOver(gameScore);
    }
  };

  const toggleFlag = (e, r, c) => {
    e.preventDefault();
    if(gameOver || revealed[r][c]) return;
    const newFlagged = [...flagged.map(row => [...row])];
    newFlagged[r][c] = !newFlagged[r][c];
    setFlagged(newFlagged);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={`status-msg ${win ? 'status-win' : gameOver ? 'status-lose' : ''}`}>
        {win ? '🎉 You cleared the minefield!' : gameOver ? '💥 BOOM! Game Over.' : 'Click to reveal, right-click to flag'}
      </div>
      
      <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '4px' }}>
          {grid.map((row, r) => row.map((val, c) => {
            const isRevealed = revealed[r][c];
            const isFlagged = flagged[r][c];
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => click(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                style={{
                  width: '32px', height: '32px', borderRadius: '4px',
                  background: isRevealed ? (val === -1 ? '#fca5a5' : 'var(--bg-secondary)') : 'var(--pastel-blue)',
                  border: `1px solid ${isRevealed ? 'var(--border)' : '#bfdbfe'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '14px', cursor: isRevealed ? 'default' : 'pointer',
                  color: ['transparent', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#14b8a6', '#000', '#64748b'][Math.max(0, val)]
                }}
              >
                {isRevealed ? (val === -1 ? '💣' : val > 0 ? val : '') : (isFlagged ? '🚩' : '')}
              </div>
            );
          }))}
        </div>
      </div>
      
      <button className="btn btn-primary" onClick={initGame} style={{ marginTop: '24px' }}>Restart</button>
    </div>
  );
}
