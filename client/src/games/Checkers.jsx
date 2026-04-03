import { useState, useCallback, useRef } from 'react';

// Board: 64 squares. Row 0 = top (black/AI), Row 7 = bottom (red/player).
// Only dark squares (row+col)%2===1 are used.
// Pieces: 'r'=red(player), 'R'=red king, 'b'=black(AI), 'B'=black king

const SCORE_BASE = { easy: 100, medium: 160, hard: 250 };

function createBoard() {
  return Array(64).fill(null).map((_, i) => {
    const row = Math.floor(i / 8), col = i % 8;
    if ((row + col) % 2 === 0) return null;
    if (row < 3) return 'b';
    if (row > 4) return 'r';
    return null;
  });
}

const isRed = p => p === 'r' || p === 'R';
const isBlack = p => p === 'b' || p === 'B';
const isKing = p => p === 'R' || p === 'B';

function getPieceMoves(board, idx, jumpOnly = false) {
  const piece = board[idx];
  if (!piece) return [];
  const row = Math.floor(idx / 8), col = idx % 8;
  const red = isRed(piece), king = isKing(piece);
  const dirs = [];
  if (red || king) dirs.push([-1, -1], [-1, 1]);  // red moves up
  if (!red || king) dirs.push([1, -1], [1, 1]);    // black moves down

  const jumps = [], moves = [];
  for (const [dr, dc] of dirs) {
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
    const nidx = nr * 8 + nc;
    if (!board[nidx]) {
      if (!jumpOnly) moves.push({ from: idx, to: nidx, isJump: false });
    } else {
      const enemy = red ? isBlack(board[nidx]) : isRed(board[nidx]);
      if (enemy) {
        const jr = nr + dr, jc = nc + dc;
        if (jr >= 0 && jr <= 7 && jc >= 0 && jc <= 7) {
          const jidx = jr * 8 + jc;
          if (!board[jidx]) jumps.push({ from: idx, to: jidx, captured: nidx, isJump: true });
        }
      }
    }
  }
  return jumps.length > 0 ? jumps : (jumpOnly ? [] : moves);
}

function getAllMoves(board, redTurn) {
  const jumps = [], moves = [];
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p || (redTurn ? !isRed(p) : !isBlack(p))) continue;
    getPieceMoves(board, i).forEach(m => (m.isJump ? jumps : moves).push(m));
  }
  return jumps.length > 0 ? jumps : moves;
}

function applyMove(board, move) {
  const nb = [...board];
  const piece = nb[move.from];
  nb[move.to] = piece;
  nb[move.from] = null;
  if (move.captured !== undefined) nb[move.captured] = null;
  const row = Math.floor(move.to / 8);
  if (piece === 'r' && row === 0) nb[move.to] = 'R';
  if (piece === 'b' && row === 7) nb[move.to] = 'B';
  return nb;
}

function evaluate(board) {
  let s = 0;
  board.forEach(p => {
    if (p === 'r') s -= 1; if (p === 'R') s -= 2;
    if (p === 'b') s += 1; if (p === 'B') s += 2;
  });
  return s;
}

function minimax(board, depth, alpha, beta, blackTurn) {
  const moves = getAllMoves(board, !blackTurn);
  if (depth === 0 || moves.length === 0) return evaluate(board);
  if (blackTurn) {
    let max = -Infinity;
    for (const m of moves) {
      const v = minimax(applyMove(board, m), depth - 1, alpha, beta, false);
      if (v > max) max = v;
      if (v > alpha) alpha = v;
      if (beta <= alpha) break;
    }
    return max;
  } else {
    let min = Infinity;
    for (const m of moves) {
      const v = minimax(applyMove(board, m), depth - 1, alpha, beta, true);
      if (v < min) min = v;
      if (v < beta) beta = v;
      if (beta <= alpha) break;
    }
    return min;
  }
}

function getAIMove(board, difficulty) {
  const moves = getAllMoves(board, false); // black's moves
  if (!moves.length) return null;
  if (difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)];
  if (difficulty === 'medium') {
    let best = moves[0], bestScore = -Infinity;
    for (const m of moves) {
      const s = evaluate(applyMove(board, m));
      if (s > bestScore) { bestScore = s; best = m; }
    }
    return best;
  }
  // hard: minimax
  let best = moves[0], bestScore = -Infinity;
  for (const m of moves) {
    const s = minimax(applyMove(board, m), 3, -Infinity, Infinity, false);
    if (s > bestScore) { bestScore = s; best = m; }
  }
  return best;
}

function checkWinner(board) {
  const redPieces = board.filter(isRed).length;
  const blackPieces = board.filter(isBlack).length;
  if (blackPieces === 0 || getAllMoves(board, false).length === 0) return 'red';
  if (redPieces === 0 || getAllMoves(board, true).length === 0) return 'black';
  return null;
}

export default function Checkers({ onGameOver, difficulty = 'medium' }) {
  const nextStarterRef = useRef(Math.random() < 0.5 ? 'player' : 'bot');
  const [starter, setStarter] = useState(nextStarterRef.current);
  
  const [board, setBoard] = useState(createBoard);
  const [selected, setSelected] = useState(null);
  const [validDests, setValidDests] = useState([]);
  const [mustJumpFrom, setMustJumpFrom] = useState(null);
  const [redTurn, setRedTurn] = useState(starter === 'player');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [captured, setCaptured] = useState({ red: 0, black: 0 });

  // Synchronous ref — set immediately so player can't click while AI runs.
  // Unlike useState, this blocks clicks BEFORE the next render.
  const aiLock = useRef(false);

  // Keep latest values accessible in callbacks without stale closures
  const difficultyRef = useRef(difficulty);
  const onGameOverRef = useRef(onGameOver);
  const gameOverRef = useRef(gameOver);
  difficultyRef.current = difficulty;
  onGameOverRef.current = onGameOver;
  gameOverRef.current = gameOver;

  const endGame = useCallback((win, b) => {
    setGameOver(true);
    setWinner(win);
    if (win === 'red') {
      const base = SCORE_BASE[difficultyRef.current] || 160;
      const bonus = b.filter(isBlack).length === 0 ? 50 : 0;
      setTimeout(() => onGameOverRef.current(base + bonus), 300);
    }
  }, []);

  /**
   * Run the AI turn. Receives the EXACT board and captured state to use —
   * no refs, no stale closures, no race conditions.
   */
  const runAI = useCallback((currentBoard, currentCaptured) => {
    // aiLock is already true when this is called
    setAiThinking(true);
    setRedTurn(false);

    const diff = difficultyRef.current;
    const delay = diff === 'hard' ? 700 : 400;

    setTimeout(() => {
      // If game ended while AI was "thinking", bail out
      if (gameOverRef.current) {
        aiLock.current = false;
        setAiThinking(false);
        return;
      }

      const move = getAIMove(currentBoard, diff);
      if (!move) {
        // AI has no moves → player wins
        aiLock.current = false;
        setAiThinking(false);
        endGame('red', currentBoard);
        return;
      }

      let nb = applyMove(currentBoard, move);
      const newCaptured = { ...currentCaptured };
      if (move.isJump) {
        newCaptured.black++;
        // Chain all further jumps automatically
        let further = getPieceMoves(nb, move.to, true);
        while (further.length > 0) {
          const next = further[0];
          nb = applyMove(nb, next);
          newCaptured.black++;
          further = getPieceMoves(nb, next.to, true);
        }
      }

      // Apply AI result to state
      setBoard(nb);
      setCaptured(newCaptured);
      setSelected(null);
      setValidDests([]);
      setAiThinking(false);
      aiLock.current = false; // Release lock before checking winner

      const w = checkWinner(nb);
      if (w) {
        endGame(w, nb);
      } else {
        setRedTurn(true);
      }
    }, delay);
  }, [endGame]);

  const initialBotMoveTriggered = useRef(false);

  useEffect(() => {
    if (starter === 'bot' && !redTurn && !initialBotMoveTriggered.current) {
      initialBotMoveTriggered.current = true;
      aiLock.current = true;
      runAI(board, captured);
    }
  }, [starter, redTurn, board, captured, runAI]);

  // ---- Player input handler ----
  const handleClick = (idx) => {
    // Guard: must be player's turn, game active, AI not running
    if (!redTurn || gameOver || aiLock.current) return;

    const piece = board[idx];
    const allMoves = getAllMoves(board, true);
    const hasForceJump = allMoves.some(m => m.isJump);

    // --- Continuation of a multi-jump ---
    if (mustJumpFrom !== null) {
      const jumps = getPieceMoves(board, mustJumpFrom, true);
      const move = jumps.find(m => m.to === idx);
      if (!move) return; // clicked somewhere invalid — do nothing
      const nb = applyMove(board, move);
      const newCaptured = { ...captured, red: captured.red + 1 };
      const further = getPieceMoves(nb, move.to, true);
      if (further.length > 0) {
        // Still more jumps available — stay in multi-jump mode
        setBoard(nb);
        setCaptured(newCaptured);
        setMustJumpFrom(move.to);
        setSelected(move.to);
        setValidDests(further.map(m => m.to));
      } else {
        // Jump chain complete — hand off to AI
        setBoard(nb);
        setCaptured(newCaptured);
        setMustJumpFrom(null);
        setSelected(null);
        setValidDests([]);
        const w = checkWinner(nb);
        if (w) {
          endGame(w, nb);
        } else {
          aiLock.current = true; // Lock immediately, before any state update
          runAI(nb, newCaptured);
        }
      }
      return;
    }

    // --- Select a piece ---
    if (piece && isRed(piece)) {
      const pieceMoves = getPieceMoves(board, idx);
      const filtered = hasForceJump
        ? pieceMoves.filter(m => m.isJump)
        : pieceMoves;
      // If a jump is forced but this piece has no jumps, refuse selection
      if (hasForceJump && filtered.length === 0) {
        setSelected(null);
        setValidDests([]);
        return;
      }
      setSelected(idx);
      setValidDests(filtered.map(m => m.to));
      return;
    }

    // --- Move selected piece to destination ---
    if (selected !== null && validDests.includes(idx)) {
      const move = getPieceMoves(board, selected).find(m => m.to === idx);
      if (!move) return;
      const nb = applyMove(board, move);
      const newCaptured = { ...captured };

      if (move.isJump) {
        newCaptured.red++;
        const further = getPieceMoves(nb, move.to, true);
        if (further.length > 0) {
          // Multi-jump: stay on player's turn
          setBoard(nb);
          setCaptured(newCaptured);
          setMustJumpFrom(move.to);
          setSelected(move.to);
          setValidDests(further.map(m => m.to));
          return;
        }
      }

      // Move complete — hand off to AI
      setBoard(nb);
      setCaptured(newCaptured);
      setSelected(null);
      setValidDests([]);
      setMustJumpFrom(null);
      const w = checkWinner(nb);
      if (w) {
        endGame(w, nb);
      } else {
        aiLock.current = true; // Lock immediately
        runAI(nb, newCaptured);
      }
      return;
    }

    // --- Deselect ---
    setSelected(null);
    setValidDests([]);
  };

  const restart = () => {
    aiLock.current = false;
    const newStarter = starter === 'player' ? 'bot' : 'player';
    nextStarterRef.current = newStarter;
    setStarter(newStarter);
    initialBotMoveTriggered.current = false;
    setBoard(createBoard());
    setSelected(null);
    setValidDests([]);
    setMustJumpFrom(null);
    setRedTurn(newStarter === 'player');
    setGameOver(false);
    setWinner(null);
    setCaptured({ red: 0, black: 0 });
    setAiThinking(false);
  };

  const redCount = board.filter(isRed).length;
  const blackCount = board.filter(isBlack).length;
  const allPlayerMoves = redTurn && !gameOver ? getAllMoves(board, true) : [];
  const forceJump = allPlayerMoves.some(m => m.isJump);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
      <div style={{
        fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
      }}>
        {starter === 'player' ? '🔴 You start this round' : '⚫ Bot starts this round'}
      </div>

      <div className={`status-msg ${gameOver ? (winner === 'red' ? 'status-win' : 'status-lose') : ''}`}>
        {gameOver
          ? winner === 'red' ? '🎉 You win!' : '😞 AI wins!'
          : aiThinking ? '🤔 AI is thinking...'
          : mustJumpFrom !== null ? '⚡ Continue jumping!'
          : forceJump ? '⚡ Jump is forced!'
          : redTurn ? '🔴 Your turn — click a piece' : '⏳ AI is thinking...'}
      </div>

      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-muted)' }}>
        <span style={{ color: '#ef4444' }}>🔴 You: {redCount}</span>
        <span>|</span>
        <span>⚫ AI: {blackCount}</span>
        {captured.red > 0 && <span style={{ color: '#16a34a' }}>Your captures: {captured.red}</span>}
        {captured.black > 0 && <span style={{ color: '#6b7280' }}>AI captures: {captured.black}</span>}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
        width: '100%', maxWidth: '460px',
        border: '3px solid var(--border-hover)',
        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {board.map((piece, idx) => {
          const row = Math.floor(idx / 8), col = idx % 8;
          const dark = (row + col) % 2 === 1;
          const isSel = selected === idx;
          const isDest = validDests.includes(idx);
          const isMustJump = mustJumpFrom === idx;

          let bg = dark ? '#4a6741' : '#f5f0e8';
          if (dark && (isSel || isMustJump)) bg = '#7c3aed';
          else if (dark && isDest) bg = '#15803d';

          return (
            <div
              key={idx}
              onClick={() => dark && handleClick(idx)}
              style={{
                aspectRatio: '1', background: bg,
                cursor: dark && redTurn && !gameOver && !aiLock.current ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', transition: 'background 0.15s',
              }}
            >
              {isDest && !piece && (
                <div style={{
                  width: '35%', height: '35%', borderRadius: '50%',
                  background: 'rgba(134,239,172,0.7)', border: '2px solid #86efac',
                }} />
              )}
              {piece && (
                <div style={{
                  width: '78%', height: '78%', borderRadius: '50%',
                  background: isRed(piece)
                    ? 'radial-gradient(circle at 35% 35%, #f87171, #b91c1c)'
                    : 'radial-gradient(circle at 35% 35%, #6b7280, #111827)',
                  border: isSel
                    ? '3px solid #fbbf24'
                    : isRed(piece) ? '2px solid #991b1c' : '2px solid #374151',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', color: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)',
                  transform: isSel ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.15s',
                }}>
                  {isKing(piece) ? '♛' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
        🔴 You (Red) vs ⚫ AI (Black) · Kings shown with ♛ · Jumps are forced
      </div>

      {gameOver && (
        <button className="btn btn-primary" onClick={restart} style={{ marginTop: '20px' }}>
          Next Round
        </button>
      )}
    </div>
  );
}
