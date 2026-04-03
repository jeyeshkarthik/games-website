import { useState, useEffect, useCallback } from 'react';

// Board: 64 squares. Row 0 = top (black start), Row 7 = bottom (red start).
// Only dark squares (row+col)%2===1 are used.
// Pieces: 'r'=red, 'R'=red king, 'b'=black, 'B'=black king

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
  if (red || king) dirs.push([-1, -1], [-1, 1]);
  if (!red || king) dirs.push([1, -1], [1, 1]);

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
  const moves = getAllMoves(board, false);
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
  // hard: minimax depth 4
  let best = moves[0], bestScore = -Infinity;
  for (const m of moves) {
    const s = minimax(applyMove(board, m), 3, -Infinity, Infinity, false);
    if (s > bestScore) { bestScore = s; best = m; }
  }
  return best;
}

function checkWinner(board) {
  const redMoves = getAllMoves(board, true);
  const blackMoves = getAllMoves(board, false);
  const redCount = board.filter(isRed).length;
  const blackCount = board.filter(isBlack).length;
  if (blackCount === 0 || blackMoves.length === 0) return 'red';
  if (redCount === 0 || redMoves.length === 0) return 'black';
  return null;
}

export default function Checkers({ onGameOver, difficulty = 'medium' }) {
  const [board, setBoard] = useState(createBoard);
  const [selected, setSelected] = useState(null);
  const [validDests, setValidDests] = useState([]);
  const [mustJumpFrom, setMustJumpFrom] = useState(null);
  const [redTurn, setRedTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [captured, setCaptured] = useState({ red: 0, black: 0 });

  const endGame = useCallback((win, b) => {
    setGameOver(true);
    setWinner(win);
    if (win === 'red') {
      const base = SCORE_BASE[difficulty] || 160;
      const bonus = b.filter(isBlack).length === 0 ? 50 : 0;
      setTimeout(() => onGameOver(base + bonus), 300);
    }
  }, [difficulty, onGameOver]);

  // AI turn
  useEffect(() => {
    if (redTurn || gameOver || aiThinking) return;
    setAiThinking(true);
    const delay = difficulty === 'hard' ? 700 : 400;
    const timer = setTimeout(() => {
      const move = getAIMove(board, difficulty);
      if (!move) { endGame('red', board); setAiThinking(false); return; }

      let nb = applyMove(board, move);
      let newCaptured = { ...captured };
      if (move.isJump) {
        newCaptured.black++;
        // AI auto-chains all jumps
        let furtherJumps = getPieceMoves(nb, move.to, true);
        while (furtherJumps.length > 0) {
          const next = furtherJumps[0];
          nb = applyMove(nb, next);
          newCaptured.black++;
          furtherJumps = getPieceMoves(nb, next.to, true);
        }
      }

      setCaptured(newCaptured);
      setBoard(nb);
      setSelected(null);
      setValidDests([]);
      const w = checkWinner(nb);
      if (w) { endGame(w, nb); } else { setRedTurn(true); }
      setAiThinking(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [redTurn, board, gameOver, aiThinking, difficulty, captured, endGame]);

  const handleClick = (idx) => {
    if (!redTurn || gameOver || aiThinking) return;
    const piece = board[idx];
    const allMoves = getAllMoves(board, true);
    const hasForceJump = allMoves.some(m => m.isJump);

    // Multi-jump continuation
    if (mustJumpFrom !== null) {
      const jumps = getPieceMoves(board, mustJumpFrom, true);
      const move = jumps.find(m => m.to === idx);
      if (move) {
        const nb = applyMove(board, move);
        const newCaptured = { ...captured, red: captured.red + 1 };
        const further = getPieceMoves(nb, move.to, true);
        if (further.length > 0) {
          setBoard(nb); setCaptured(newCaptured);
          setMustJumpFrom(move.to); setSelected(move.to);
          setValidDests(further.map(m => m.to));
        } else {
          setBoard(nb); setCaptured(newCaptured);
          setMustJumpFrom(null); setSelected(null); setValidDests([]);
          const w = checkWinner(nb);
          if (w) endGame(w, nb); else setRedTurn(false);
        }
      }
      return;
    }

    // Select a piece
    if (piece && isRed(piece)) {
      const pieceMoves = getPieceMoves(board, idx);
      const filtered = hasForceJump ? pieceMoves.filter(m => m.isJump) : pieceMoves;
      setSelected(idx);
      setValidDests(filtered.map(m => m.to));
      return;
    }

    // Move selected piece
    if (selected !== null && validDests.includes(idx)) {
      const move = getPieceMoves(board, selected).find(m => m.to === idx);
      if (!move) return;
      const nb = applyMove(board, move);
      const newCaptured = { ...captured };
      if (move.isJump) {
        newCaptured.red++;
        const further = getPieceMoves(nb, move.to, true);
        if (further.length > 0) {
          setBoard(nb); setCaptured(newCaptured);
          setMustJumpFrom(move.to); setSelected(move.to);
          setValidDests(further.map(m => m.to));
          return;
        }
      }
      setBoard(nb); setCaptured(newCaptured);
      setSelected(null); setValidDests([]); setMustJumpFrom(null);
      const w = checkWinner(nb);
      if (w) endGame(w, nb); else setRedTurn(false);
      return;
    }

    // Deselect
    setSelected(null);
    setValidDests([]);
  };

  const restart = () => {
    setBoard(createBoard()); setSelected(null); setValidDests([]);
    setMustJumpFrom(null); setRedTurn(true); setGameOver(false);
    setWinner(null); setCaptured({ red: 0, black: 0 });
  };

  const redCount = board.filter(isRed).length;
  const blackCount = board.filter(isBlack).length;
  const allPlayerMoves = redTurn && !gameOver ? getAllMoves(board, true) : [];
  const forceJump = allPlayerMoves.some(m => m.isJump);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
      <div className={`status-msg ${gameOver ? (winner === 'red' ? 'status-win' : 'status-lose') : ''}`}>
        {gameOver
          ? winner === 'red' ? '🎉 You win!' : '😞 AI wins!'
          : aiThinking ? '🤔 AI is thinking...'
          : mustJumpFrom !== null ? '⚡ Continue jumping!'
          : forceJump ? '⚡ Jump is forced!'
          : redTurn ? '🔴 Your turn — click a piece' : '⏳ AI is thinking...'}
      </div>

      {/* Score bar */}
      <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-muted)' }}>
        <span style={{ color: '#ef4444' }}>🔴 You: {redCount} pieces</span>
        <span>|</span>
        <span>⚫ AI: {blackCount} pieces</span>
        {captured.red > 0 && <span style={{ color: '#16a34a' }}>✓ Captured: {captured.red}</span>}
      </div>

      {/* Board */}
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

          let bg = dark ? '#5a7a5a' : '#f5f0e8';
          if (dark && isSel) bg = '#7c3aed';
          else if (dark && isMustJump) bg = '#7c3aed';
          else if (dark && isDest) bg = '#15803d';
          else if (dark) bg = '#4a6741';

          return (
            <div
              key={idx}
              onClick={() => dark ? handleClick(idx) : null}
              style={{
                aspectRatio: '1', background: bg,
                cursor: dark && redTurn && !gameOver ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', transition: 'background 0.15s',
              }}
            >
              {isDest && !piece && (
                <div style={{ width: '35%', height: '35%', borderRadius: '50%', background: 'rgba(134,239,172,0.7)', border: '2px solid #86efac' }} />
              )}
              {piece && (
                <div style={{
                  width: '78%', height: '78%', borderRadius: '50%',
                  background: isRed(piece)
                    ? `radial-gradient(circle at 35% 35%, #f87171, #b91c1c)`
                    : `radial-gradient(circle at 35% 35%, #6b7280, #111827)`,
                  border: isSel ? '3px solid #fbbf24' : isRed(piece) ? '2px solid #991b1c' : '2px solid #374151',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', color: 'rgba(255,255,255,0.9)',
                  boxShadow: `0 4px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.2)`,
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
          Play Again
        </button>
      )}
    </div>
  );
}
