import { useState, useEffect } from 'react';

export default function Game2048({ onGameOver }) {
  const [grid, setGrid] = useState(Array.from({length:4},()=>Array(4).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const addTile = (currentGrid) => {
    const empty=[];
    currentGrid.forEach((row,r)=>row.forEach((v,c)=>{if(!v)empty.push([r,c]);}));
    if(!empty.length) return false;
    const [r,c]=empty[Math.floor(Math.random()*empty.length)];
    currentGrid[r][c]=Math.random()<0.9?2:4;
    return true;
  };

  const initGame = () => {
    const newGrid = Array.from({length:4},()=>Array(4).fill(0));
    addTile(newGrid); addTile(newGrid);
    setGrid(newGrid); setScore(0); setGameOver(false);
  };

  useEffect(() => { initGame(); }, []);

  useEffect(() => {
    const handleKey = (e) => {
      const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
      if(m[e.key]){e.preventDefault(); move(m[e.key]);}
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const move = (dir) => {
    if(gameOver) return;
    let newGrid = grid.map(r => [...r]);
    let gained = 0;
    
    const slide = (row) => {
      let filtered={row:row.filter(v=>v), score:0}, newRow=[];
      for(let i=0;i<filtered.row.length;i++) {
        if(i+1<filtered.row.length && filtered.row[i]===filtered.row[i+1]) {
          newRow.push(filtered.row[i]*2); filtered.score+=filtered.row[i]*2; i++;
        } else { newRow.push(filtered.row[i]); }
      }
      while(newRow.length<4) newRow.push(0);
      return {row:newRow, score:filtered.score};
    };

    if(dir==='left'||dir==='right') {
      newGrid=newGrid.map(row=>{
        const res=slide(dir==='right'?row.slice().reverse():row);
        gained+=res.score;
        return dir==='right'?res.row.reverse():res.row;
      });
    } else {
      const cols=Array.from({length:4},(_,c)=>newGrid.map(r=>r[c]));
      const moved=cols.map(col=>{
        const res=slide(dir==='down'?col.slice().reverse():col);
        gained+=res.score;
        return dir==='down'?res.row.reverse():res.row;
      });
      newGrid=newGrid.map((r,ri)=>r.map((_,ci)=>moved[ci][ri]));
    }

    if(JSON.stringify(grid)!==JSON.stringify(newGrid)) { 
      addTile(newGrid); 
      setGrid(newGrid); 
      setScore(s => {
        const newScore = s + gained;
        checkEnd(newGrid, newScore); // Pass updated score
        return newScore;
      });
    }
  };

  const checkEnd = (currentGrid, currentScore) => {
    let hasMoves = false;
    for(let r=0;r<4;r++) for(let c=0;c<4;c++) {
      if(!currentGrid[r][c]) hasMoves = true;
      if(r<3 && currentGrid[r][c]===currentGrid[r+1][c]) hasMoves = true;
      if(c<3 && currentGrid[r][c]===currentGrid[r][c+1]) hasMoves = true;
    }
    if(!hasMoves) {
      setGameOver(true);
      onGameOver(currentScore);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={`status-msg ${gameOver ? 'status-lose' : ''}`}>{gameOver ? 'Game Over!' : 'Swipe or use arrow keys'}</div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <strong>Score: {score}</strong>
      </div>
      
      <div style={{ background: 'var(--border)', padding: '12px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {grid.flat().map((v, i) => (
            <div 
              key={i}
              style={{
                width: '60px', height: '60px', borderRadius: '4px',
                background: v ? `hsl(${Math.max(0, 50 - Math.log2(v)*5)}, 70%, 80%)` : 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: v > 1000 ? '16px' : '20px', fontWeight: 'bold', color: v ? '#fff' : 'transparent',
                boxShadow: v ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {v || ''}
            </div>
          ))}
        </div>
      </div>
      
      <button className="btn btn-primary" onClick={initGame} style={{ marginTop: '24px' }}>New Game</button>
    </div>
  );
}
