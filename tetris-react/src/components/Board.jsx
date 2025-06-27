// src/components/Board.jsx
import React, { useRef, useEffect, useState } from "react";

// Default palette fallback (optional)
const DEFAULT_COLORS = [
  null,
  "#FF0D72",
  "#0DC2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF",
];

// Piece definitions (0 = empty)
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
  while (h--) matrix.push(new Array(w).fill(null));
  return matrix;
}

function drawMatrix(ctx, matrix, offset, colorOverride) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0 && value != null) {
        const color = colorOverride
          ? colorOverride
          : typeof value === "string"
          ? value
          : DEFAULT_COLORS[value] || "#888";
        ctx.fillStyle = color;
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function collide(arena, { matrix, pos }) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      if (matrix[y][x] !== 0) {
        const ay = y + pos.y;
        const ax = x + pos.x;
        if (
          ay < 0 ||
          ay >= arena.length ||
          ax < 0 ||
          ax >= arena[0].length ||
          arena[ay][ax] != null
        ) {
          return true;
        }
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
          arena[ay][ax] = player.color;
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
  const types = Object.keys(PIECES);
  return PIECES[types[(Math.random() * types.length) | 0]];
}

function randomColor() {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;
}

export default function Board({ onGameOver }) {
  const canvasRef = useRef(null);
  const [arena] = useState(() => createMatrix(10, 20));
  const [player, setPlayer] = useState(() => ({
    pos: { x: 0, y: 0 },
    matrix: randomPiece(),
    color: randomColor(),
    score: 0,
  }));
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

  useEffect(() => {
    if (gameOver && onGameOver) setTimeout(onGameOver, 2000);
  }, [gameOver, onGameOver]);

  function playerMove(dir) {
    const p = playerRef.current;
    const pos = { x: p.pos.x + dir, y: p.pos.y };
    if (!collide(arena, { matrix: p.matrix, pos })) {
      setPlayer((prev) => ({ ...prev, pos }));
    }
  }

  function playerDrop() {
    const p = playerRef.current;
    const pos = { x: p.pos.x, y: p.pos.y + 1 };
    if (!collide(arena, { matrix: p.matrix, pos })) {
      setPlayer((prev) => ({ ...prev, pos }));
    } else {
      merge(arena, p);
      arenaSweep();
      playerReset();
    }
  }

  function rotatePlayer(dir) {
    const p = playerRef.current;
    const cloned = p.matrix.map((row) => [...row]);
    rotate(cloned, dir);
    if (!collide(arena, { matrix: cloned, pos: p.pos })) {
      setPlayer((prev) => ({ ...prev, matrix: cloned }));
    }
  }

  function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
      for (let x = 0; x < arena[y].length; ++x) {
        if (arena[y][x] == null) continue outer;
      }
      const row = arena.splice(y, 1)[0].fill(null);
      arena.unshift(row);
      setPlayer((prev) => ({ ...prev, score: prev.score + rowCount * 10 }));
      rowCount *= 2;
      y++;
    }
  }

  function playerReset() {
    const matrix = randomPiece();
    const color = randomColor();
    const x = ((arena[0].length - matrix[0].length) / 2) | 0;
    const spawn = { matrix, pos: { x, y: 0 } };
    if (collide(arena, spawn)) {
      setGameOver(true);
    } else {
      setPlayer({
        pos: spawn.pos,
        matrix,
        color,
        score: playerRef.current.score,
      });
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let lastTime = 0;

    function update(time = 0) {
      const over = gameOverRef.current;
      const delta = time - lastTime;
      lastTime = time;
      if (!over) {
        dropCounter.current += delta;
        if (dropCounter.current > dropInterval) {
          playerDrop();
          dropCounter.current = 0;
        }
        requestAnimationFrame(update);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(20, 20);
      drawMatrix(ctx, arena, { x: 0, y: 0 });
      drawMatrix(
        ctx,
        playerRef.current.matrix,
        playerRef.current.pos,
        playerRef.current.color
      );
      ctx.restore();

      if (over) {
        const text = "Game Over!";
        ctx.font = "20px 'Pixelify Sans'";
        ctx.fillStyle = "white";
        const m = ctx.measureText(text);
        const x = (canvas.width - m.width) / 2;
        const y = canvas.height / 2;
        ctx.fillText(text, x, y);
      }
    }

    function keyHandler(e) {
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

    window.addEventListener("keydown", keyHandler);
    playerReset();
    requestAnimationFrame(update);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [onGameOver]);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={10 * 20} height={20 * 20} />
      <div className="score">Score: {player.score}</div>
      <div className="controls">Controls: ←/→ move • ↓ drop • Z/X rotate</div>
      <div className="touch-controls">
        <button
          onClick={() => playerMove(-1)}
          onTouchStart={() => playerMove(-1)}
        >
          ←
        </button>
        <button
          onClick={() => rotatePlayer(-1)}
          onTouchStart={() => rotatePlayer(-1)}
        >
          ⟲
        </button>
        <button onClick={() => playerDrop()} onTouchStart={() => playerDrop()}>
          ↓
        </button>
        <button
          onClick={() => rotatePlayer(1)}
          onTouchStart={() => rotatePlayer(1)}
        >
          ⟳
        </button>
        <button
          onClick={() => playerMove(1)}
          onTouchStart={() => playerMove(1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
