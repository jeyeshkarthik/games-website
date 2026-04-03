import { useState, useEffect, useRef } from 'react';

const GRID = 20, COLS = 21, ROWS = 21;

export default function Snake({ onGameOver }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const snakeRef = useRef([{x:10, y:10}, {x:9,y:10}, {x:8,y:10}]);
  const dirRef = useRef('RIGHT');
  const nextDirRef = useRef('RIGHT');
  const foodRef = useRef({x:15, y:10});

  useEffect(() => {
    const handleKey = (e) => {
      const map = {ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT'};
      if (map[e.key]) { e.preventDefault(); changeDir(map[e.key]); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!running) { draw(); return; }
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [running]);

  const placeFood = () => {
    let newFood;
    while(true) {
      newFood = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
      if (!snakeRef.current.some(s => s.x===newFood.x && s.y===newFood.y)) break;
    }
    foodRef.current = newFood;
  };

  const changeDir = (d) => {
    const opp = {UP:'DOWN',DOWN:'UP',LEFT:'RIGHT',RIGHT:'LEFT'};
    if (d !== opp[dirRef.current]) nextDirRef.current = d;
  };

  const tick = () => {
    dirRef.current = nextDirRef.current;
    const head = {...snakeRef.current[0]};
    if (dirRef.current==='UP') head.y--;
    if (dirRef.current==='DOWN') head.y++;
    if (dirRef.current==='LEFT') head.x--;
    if (dirRef.current==='RIGHT') head.x++;

    if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||snakeRef.current.some(s=>s.x===head.x&&s.y===head.y)) {
      setRunning(false);
      setGameOver(true);
      onGameOver(score);
      return;
    }

    snakeRef.current.unshift(head);
    if (head.x===foodRef.current.x && head.y===foodRef.current.y) {
      setScore(s => s + 10);
      placeFood();
    } else {
      snakeRef.current.pop();
    }
    draw();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    
    // Light Pastel grid
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let i=0;i<=COLS;i++) { ctx.beginPath(); ctx.moveTo(i*GRID,0); ctx.lineTo(i*GRID,canvas.height); ctx.stroke(); }
    for (let i=0;i<=ROWS;i++) { ctx.beginPath(); ctx.moveTo(0,i*GRID); ctx.lineTo(canvas.width,i*GRID); ctx.stroke(); }
    
    // Food (warm red/coral)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(foodRef.current.x*GRID+GRID/2, foodRef.current.y*GRID+GRID/2, GRID/2-2, 0, Math.PI*2);
    ctx.fill();
    
    // Snake (Pastel teals gradient)
    snakeRef.current.forEach((seg, i) => {
      ctx.fillStyle = i===0 ? '#14b8a6' : '#5eead4';
      ctx.beginPath();
      ctx.roundRect(seg.x*GRID+1, seg.y*GRID+1, GRID-2, GRID-2, i===0?8:4);
      ctx.fill();
    });
  };

  const start = () => {
    snakeRef.current = [{x:10, y:10}, {x:9,y:10}, {x:8,y:10}];
    dirRef.current = 'RIGHT'; nextDirRef.current = 'RIGHT';
    setScore(0); setGameOver(false);
    placeFood();
    setRunning(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div className="status-msg">Score: {score}</div>
      
      <div style={{ position: 'relative', background: '#fff', padding: '10px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
        <canvas ref={canvasRef} width={420} height={420} style={{ display: 'block', borderRadius: 'var(--radius-md)', background: '#fdfbf7' }}></canvas>
        
        {(!running && !gameOver) && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.7)', borderRadius:'var(--radius-lg)', backdropFilter:'blur(4px)' }}>
            <button className="btn btn-primary" onClick={start}>Start Game</button>
          </div>
        )}
        
        {gameOver && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', gap:'16px', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.85)', borderRadius:'var(--radius-lg)', backdropFilter:'blur(4px)' }}>
            <h2 style={{color: '#e11d48'}}>Game Over!</h2>
            <p>Score: {score}</p>
            <button className="btn btn-primary" onClick={start}>Play Again</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateAreas: '". u ." "l . r" ". d ."', gap: '8px' }}>
        <button className="btn btn-secondary" style={{gridArea:'u'}} onClick={()=>changeDir('UP')}>▲</button>
        <button className="btn btn-secondary" style={{gridArea:'l'}} onClick={()=>changeDir('LEFT')}>◀</button>
        <button className="btn btn-secondary" style={{gridArea:'r'}} onClick={()=>changeDir('RIGHT')}>▶</button>
        <button className="btn btn-secondary" style={{gridArea:'d'}} onClick={()=>changeDir('DOWN')}>▼</button>
      </div>
    </div>
  );
}
