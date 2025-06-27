// src/components/Board.jsx
import React, { useRef, useEffect, useState } from "react";

export const COLORS = [
  null,
  "#FF0D72",
  "#0DC2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF",
];

const PIECES = {
  T: [
    [0, 0, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  O: [
    [2, 2],
    [2, 2],
  ],
  I: [
    [0, 3, 0, 0],
    [0, 3, 0, 0],
    [0, 3, 0, 0],
    [0, 3, 0, 0],
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  J: [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function drawMatrix(ctx, matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function collide(arena, { matrix, pos }) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      if (
        matrix[y][x] !== 0 &&
        (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const ay = y + player.pos.y;
        const ax = x + player.pos.x;
        if (ay >= 0 && ay < arena.length && ax >= 0 && ax < arena[0].length) {
          arena[ay][ax] = value;
        }
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach((row) => row.reverse());
  else matrix.reverse();
}

function randomPiece() {
  const keys = Object.keys(PIECES);
  return PIECES[keys[(Math.random() * keys.length) | 0]];
}

// Accepts an onGameOver callback to return to start
export default function Board({ onGameOver }) {
  const canvasRef = useRef(null);
  const [arena] = useState(() => createMatrix(10, 20));
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    matrix: randomPiece(),
    score: 0,
  });
  const [gameOver, setGameOver] = useState(false);

  const playerRef = useRef(player);
  const gameOverRef = useRef(gameOver);
  const dropCounter = useRef(0);
  const dropInterval = 1000;

  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Notify parent when gameOver flips, after 2s
  useEffect(() => {
    if (gameOver && onGameOver) {
      setTimeout(() => onGameOver(), 2000);
    }
  }, [gameOver, onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let lastTime = 0;

    function update(time = 0) {
      const isOver = gameOverRef.current;
      const delta = time - lastTime;
      lastTime = time;

      if (!isOver) {
        dropCounter.current += delta;
        if (dropCounter.current > dropInterval) {
          playerDrop();
          dropCounter.current = 0;
        }
        requestAnimationFrame(update);
      }

      // Clear full canvas in pixel-space
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw arena + piece in block-space
      ctx.save();
      ctx.scale(20, 20);
      drawMatrix(ctx, arena, { x: 0, y: 0 });
      drawMatrix(ctx, playerRef.current.matrix, playerRef.current.pos);
      ctx.restore();

      // Draw centered Game Over text
      if (isOver) {
        const text = "Game Over!";
        ctx.font = "20px 'Pixelify Sans'";
        ctx.fillStyle = "white";
        const metrics = ctx.measureText(text);
        const x = (canvas.width - metrics.width) / 2;
        const y = canvas.height / 2;
        ctx.fillText(text, x, y);
      }
    }

    function playerDrop() {
      const p = playerRef.current;
      const next = { x: p.pos.x, y: p.pos.y + 1 };
      if (!collide(arena, { matrix: p.matrix, pos: next })) {
        setPlayer((prev) => ({ ...prev, pos: next }));
      } else {
        merge(arena, p);
        arenaSweep();
        playerReset();
      }
    }

    function arenaSweep() {
      let rowCount = 1;
      outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
          if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        setPlayer((prev) => ({ ...prev, score: prev.score + rowCount * 10 }));
        rowCount *= 2;
        y++;
      }
    }

    function playerReset() {
      const matrix = randomPiece();
      const x = ((arena[0].length - matrix[0].length) / 2) | 0;
      const spawn = { matrix, pos: { x, y: 0 } };
      if (collide(arena, spawn)) {
        setGameOver(true);
      } else {
        setPlayer({ pos: spawn.pos, matrix, score: playerRef.current.score });
      }
    }

    function playerMove(dir) {
      const p = playerRef.current;
      const next = { x: p.pos.x + dir, y: p.pos.y };
      if (!collide(arena, { matrix: p.matrix, pos: next })) {
        setPlayer((prev) => ({ ...prev, pos: next }));
      }
    }

    function rotatePlayer(dir) {
      const p = playerRef.current;
      const cloned = p.matrix.map((r) => [...r]);
      rotate(cloned, dir);
      if (!collide(arena, { matrix: cloned, pos: p.pos })) {
        setPlayer((prev) => ({ ...prev, matrix: cloned }));
      }
    }

    function handleKey(e) {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "z", "x"].includes(e.key))
        e.preventDefault();
      if (gameOverRef.current) return;
      switch (e.key) {
        case "ArrowLeft":
          playerMove(-1);
          break;
        case "ArrowRight":
          playerMove(1);
          break;
        case "ArrowDown":
          playerDrop();
          break;
        case "z":
          rotatePlayer(-1);
          break;
        case "x":
          rotatePlayer(1);
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    playerReset();
    requestAnimationFrame(update);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onGameOver]);

  return (
    <div style={{ position: "relative", width: 10 * 20, height: 20 * 20 }}>
      <canvas ref={canvasRef} width={10 * 20} height={20 * 20} />
      <div className="score">Score: {player.score}</div>
      <div className="controls">Controls: ←/→ move • ↓ drop • Z/X rotate</div>
    </div>
  );
}
