import { useState, useEffect, useRef, useCallback } from 'react';

const TILE_COLORS = {
  0:    { bg: '#eee4da33', color: 'transparent' },
  2:    { bg: '#eee4da', color: '#776e65' },
  4:    { bg: '#ede0c8', color: '#776e65' },
  8:    { bg: '#f2b179', color: '#f9f6f2' },
  16:   { bg: '#f59563', color: '#f9f6f2' },
  32:   { bg: '#f67c5f', color: '#f9f6f2' },
  64:   { bg: '#f65e3b', color: '#f9f6f2' },
  128:  { bg: '#edcf72', color: '#f9f6f2' },
  256:  { bg: '#edcc61', color: '#f9f6f2' },
  512:  { bg: '#edc850', color: '#f9f6f2' },
  1024: { bg: '#edc53f', color: '#f9f6f2' },
  2048: { bg: '#edc22e', color: '#f9f6f2' },
};

function getTileStyle(v) {
  return TILE_COLORS[v] || { bg: '#3c3a32', color: '#f9f6f2' };
}

function addTile(grid) {
  const empty = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return grid;
  const newGrid = grid.map(r => [...r]);
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function initGrid() {
  let g = Array.from({ length: 4 }, () => Array(4).fill(0));
  g = addTile(g);
  g = addTile(g);
  return g;
}

function slideRow(row) {
  const filtered = row.filter(v => v);
  const newRow = [];
  let gained = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      newRow.push(merged);
      gained += merged;
      i += 2;
    } else {
      newRow.push(filtered[i]);
      i++;
    }
  }
  while (newRow.length < 4) newRow.push(0);
  return { row: newRow, gained };
}

function applyMove(grid, dir) {
  let newGrid = grid.map(r => [...r]);
  let totalGained = 0;

  if (dir === 'left') {
    newGrid = newGrid.map(row => {
      const { row: newRow, gained } = slideRow(row);
      totalGained += gained;
      return newRow;
    });
  } else if (dir === 'right') {
    newGrid = newGrid.map(row => {
      const { row: newRow, gained } = slideRow([...row].reverse());
      totalGained += gained;
      return newRow.reverse();
    });
  } else if (dir === 'up') {
    for (let c = 0; c < 4; c++) {
      const col = newGrid.map(r => r[c]);
      const { row: newCol, gained } = slideRow(col);
      totalGained += gained;
      newCol.forEach((v, r) => { newGrid[r][c] = v; });
    }
  } else if (dir === 'down') {
    for (let c = 0; c < 4; c++) {
      const col = newGrid.map(r => r[c]).reverse();
      const { row: newCol, gained } = slideRow(col);
      totalGained += gained;
      newCol.reverse().forEach((v, r) => { newGrid[r][c] = v; });
    }
  }

  return { newGrid, gained: totalGained };
}

function hasNoMoves(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
    }
  }
  return true;
}

export default function Game2048({ onGameOver }) {
  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Use a ref for the current state to use inside event handlers without stale closures
  const stateRef = useRef({ grid, score, gameOver, won });
  useEffect(() => { stateRef.current = { grid, score, gameOver, won }; }, [grid, score, gameOver, won]);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  const doMove = useCallback((dir) => {
    const { grid: currentGrid, score: currentScore, gameOver: isOver } = stateRef.current;
    if (isOver) return;

    const { newGrid, gained } = applyMove(currentGrid, dir);

    // Check if board changed
    if (JSON.stringify(currentGrid) === JSON.stringify(newGrid)) return;

    const withTile = addTile(newGrid);
    const newScore = currentScore + gained;
    const noMoves = hasNoMoves(withTile);
    const hasWon = withTile.flat().includes(2048);

    setGrid(withTile);
    setScore(newScore);
    setBest(prev => Math.max(prev, newScore));

    if (noMoves) {
      setGameOver(true);
      onGameOverRef.current(newScore);
    } else if (hasWon && !stateRef.current.won) {
      setWon(true);
    }
  }, []);

  // Keyboard handler
  useEffect(() => {
    const dirMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const handleKey = (e) => {
      const dir = dirMap[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [doMove]);

  // Touch/Swipe handler
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) return; // too short

    if (absDx > absDy) {
      doMove(dx > 0 ? 'right' : 'left');
    } else {
      doMove(dy > 0 ? 'down' : 'up');
    }
  };

  const restart = () => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', width: '100%', maxWidth: '320px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>{score}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Best</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>{best}</div>
        </div>
      </div>

      <div className={`status-msg ${gameOver ? 'status-lose' : won ? 'status-win' : ''}`}>
        {gameOver ? '😞 Game Over!' : won ? '🎉 You reached 2048!' : 'Swipe or use arrow keys'}
      </div>

      {/* Board */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: '#bbada0',
          padding: '10px',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          touchAction: 'none',
          userSelect: 'none',
          width: '100%',
          maxWidth: '320px',
          boxSizing: 'border-box',
        }}
      >
        {grid.flat().map((v, i) => {
          const { bg, color } = getTileStyle(v);
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: '4px',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: v >= 1024 ? '18px' : v >= 100 ? '22px' : '26px',
                fontWeight: '800',
                color,
                transition: 'background 0.1s ease',
                boxShadow: v ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {v || ''}
            </div>
          );
        })}
      </div>

      {/* Arrow buttons for desktop fallback */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '16px' }}>
        <button className="btn btn-secondary" style={{ width: '44px', height: '36px', padding: 0, fontSize: '18px' }} onClick={() => doMove('up')}>↑</button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn btn-secondary" style={{ width: '44px', height: '36px', padding: 0, fontSize: '18px' }} onClick={() => doMove('left')}>←</button>
          <button className="btn btn-secondary" style={{ width: '44px', height: '36px', padding: 0, fontSize: '18px' }} onClick={() => doMove('down')}>↓</button>
          <button className="btn btn-secondary" style={{ width: '44px', height: '36px', padding: 0, fontSize: '18px' }} onClick={() => doMove('right')}>→</button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={restart} style={{ marginTop: '16px' }}>New Game</button>
    </div>
  );
}
