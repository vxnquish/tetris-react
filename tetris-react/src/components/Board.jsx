// src/components/Board.jsx
import React, { useRef, useEffect, useState } from "react";

// High-contrast palette
const HIGH_CONTRAST = [
  "#E6194B",
  "#3CB44B",
  "#FFE119",
  "#4363D8",
  "#F58231",
  "#911EB4",
  "#46F0F0",
  "#F032E6",
  "#BCF60C",
  "#FABED4",
];

// Tetrimino shapes (0 = empty)
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

function drawMatrix(ctx, matrix, offset, overrideColor) {
  matrix.forEach((row, y) =>
    row.forEach((val, x) => {
      if (val !== 0 && val != null) {
        const color =
          overrideColor ||
          (typeof val === "string"
            ? val
            : HIGH_CONTRAST[(val - 1) % HIGH_CONTRAST.length]);
        ctx.fillStyle = color;
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    })
  );
}

function collide(arena, { matrix, pos }) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
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
  player.matrix.forEach((row, y) =>
    row.forEach((val, x) => {
      if (val !== 0) {
        const ay = y + player.pos.y;
        const ax = x + player.pos.x;
        if (ay >= 0 && ay < arena.length && ax >= 0 && ax < arena[0].length) {
          arena[ay][ax] = player.color;
        }
      }
    })
  );
}

function rotate(matrix, dir) {
  // transpose
  for (let y = 0; y < matrix.length; y++)
    for (let x = 0; x < y; x++)
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
  // reverse rows or cols
  if (dir > 0) matrix.forEach((r) => r.reverse());
  else matrix.reverse();
}

function randomPiece() {
  const types = Object.keys(PIECES);
  return PIECES[types[(Math.random() * types.length) | 0]];
}
function randomColor() {
  return HIGH_CONTRAST[(Math.random() * HIGH_CONTRAST.length) | 0];
}

export default function Board({ onGameOver }) {
  const canvasRef = useRef(null);
  const [arena] = useState(() => createMatrix(10, 20));
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    matrix: randomPiece(),
    color: randomColor(),
    score: 0,
  });
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  const playerRef = useRef(player);
  const pausedRef = useRef(paused);
  const overRef = useRef(gameOver);
  const dropCounter = useRef(0);
  const dropInterval = 1000;

  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    overRef.current = gameOver;
  }, [gameOver]);

  // movement functions honor pause state
  const playerMove = (dir) => {
    if (pausedRef.current) return;
    const p = playerRef.current;
    const pos = { x: p.pos.x + dir, y: p.pos.y };
    if (!collide(arena, { matrix: p.matrix, pos }))
      setPlayer((p) => ({ ...p, pos }));
  };
  const playerDrop = () => {
    if (pausedRef.current) return;
    const p = playerRef.current;
    const pos = { x: p.pos.x, y: p.pos.y + 1 };
    if (!collide(arena, { matrix: p.matrix, pos }))
      setPlayer((p) => ({ ...p, pos }));
    else {
      merge(arena, p);
      arenaSweep();
      playerReset();
    }
  };
  const rotatePlayer = (dir) => {
    if (pausedRef.current) return;
    const p = playerRef.current;
    const cloned = p.matrix.map((r) => [...r]);
    rotate(cloned, dir);
    if (!collide(arena, { matrix: cloned, pos: p.pos }))
      setPlayer((p) => ({ ...p, matrix: cloned }));
  };

  function arenaSweep() {
    let count = 1;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
      for (let x = 0; x < arena[y].length; ++x)
        if (arena[y][x] == null) continue outer;
      arena.splice(y, 1);
      arena.unshift(new Array(10).fill(null));
      setPlayer((p) => ({ ...p, score: p.score + count * 10 }));
      count *= 2;
      y++;
    }
  }

  const playerReset = () => {
    const matrix = randomPiece();
    const color = randomColor();
    const x = ((arena[0].length - matrix[0].length) / 2) | 0;
    const spawn = { matrix, pos: { x, y: 0 } };
    if (collide(arena, spawn)) {
      setGameOver(true);
      setTimeout(onGameOver, 3000);
    } else {
      setPlayer((p) => ({ ...p, pos: spawn.pos, matrix, color }));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let lastTime = 0;
    function update(time = 0) {
      const over = overRef.current;
      const paused = pausedRef.current;
      const delta = time - lastTime;
      lastTime = time;
      if (!over && !paused) {
        dropCounter.current += delta;
        if (dropCounter.current > dropInterval) {
          playerDrop();
          dropCounter.current = 0;
        }
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
      if (paused) {
        ctx.fillStyle = "white";
        ctx.font = "20px 'Pixelify Sans'";
        const t = "Paused";
        const m = ctx.measureText(t);
        ctx.fillText(t, (canvas.width - m.width) / 2, canvas.height / 2);
      }
      if (over) {
        ctx.fillStyle = "white";
        ctx.font = "20px 'Pixelify Sans'";
        const t = "Game Over!";
        const m = ctx.measureText(t);
        ctx.fillText(t, (canvas.width - m.width) / 2, canvas.height / 2);
      }
      requestAnimationFrame(update);
    }
    function keyHandler(e) {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowDown", "z", "x", "p"].includes(e.key)
      )
        e.preventDefault();
      if (overRef.current) return;
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
        case "p":
          setPaused((p) => !p);
          break;
      }
    }
    window.addEventListener("keydown", keyHandler);
    // start game loop without immediately resetting piece (initial state already has a spawn)
    requestAnimationFrame(update);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [onGameOver]);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={200} height={400} />
      <div className="controls touch-controls">
        <button onPointerDown={() => setPaused((p) => !p)}>
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
      <div className="score">Score: {player.score}</div>
      <div className="touch-controls">
        <button onPointerDown={() => playerMove(-1)}>←</button>
        <button onPointerDown={() => rotatePlayer(-1)}>⟲</button>
        <button onPointerDown={() => playerDrop()}>↓</button>
        <button onPointerDown={() => rotatePlayer(1)}>⟳</button>
        <button onPointerDown={() => playerMove(1)}>→</button>
      </div>
    </div>
  );
}
