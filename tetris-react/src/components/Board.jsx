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
  return Array.from({ length: h }, () => Array(w).fill(null));
}
function drawMatrix(ctx, matrix, offset, overrideColor) {
  matrix.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v !== 0 && v != null) {
        const color =
          overrideColor ||
          (typeof v === "string"
            ? v
            : HIGH_CONTRAST[(v - 1) % HIGH_CONTRAST.length]);
        ctx.fillStyle = color;
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    })
  );
}
function collide(arena, { matrix, pos }) {
  for (let y = 0; y < matrix.length; y++)
    for (let x = 0; x < matrix[y].length; x++)
      if (matrix[y][x] !== 0) {
        const ay = y + pos.y,
          ax = x + pos.x;
        if (
          ay < 0 ||
          ay >= arena.length ||
          ax < 0 ||
          ax >= arena[0].length ||
          arena[ay][ax] != null
        )
          return true;
      }
  return false;
}
function merge(arena, player) {
  player.matrix.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v !== 0) {
        const ay = y + player.pos.y,
          ax = x + player.pos.x;
        if (ay >= 0 && ay < arena.length && ax >= 0 && ax < arena[0].length)
          arena[ay][ax] = player.color;
      }
    })
  );
}
function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; y++)
    for (let x = 0; x < y; x++)
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
  if (dir > 0) matrix.forEach((r) => r.reverse());
  else matrix.reverse();
}
function randomPiece() {
  const types = Object.keys(PIECES);
  const t = types[(Math.random() * types.length) | 0];
  return PIECES[t].map((r) => [...r]);
}
function randomColor() {
  return HIGH_CONTRAST[(Math.random() * HIGH_CONTRAST.length) | 0];
}

export default function Board({ onGameOver }) {
  const canvasRef = useRef(),
    nextRef = useRef();
  const [arena] = useState(() => createMatrix(10, 20));
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    matrix: randomPiece(),
    color: randomColor(),
    score: 0,
  });
  const [nextPiece, setNextPiece] = useState({
    matrix: randomPiece(),
    color: randomColor(),
  });
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const playerRef = useRef(player),
    pausedRef = useRef(paused),
    overRef = useRef(gameOver);
  const dropCounter = useRef(0),
    dropInterval = 1000;

  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    overRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    if (countdown > 0) {
      const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(id);
    }
    playerReset();
  }, [countdown]);

  useEffect(() => {
    const ctx = nextRef.current.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.scale(20, 20);
    const offX = (4 - nextPiece.matrix[0].length) / 2,
      offY = (4 - nextPiece.matrix.length) / 2;
    drawMatrix(ctx, nextPiece.matrix, { x: offX, y: offY }, nextPiece.color);
    ctx.restore();
  }, [nextPiece]);

  function playerReset() {
    setNextPiece((prev) => {
      const { matrix, color } = prev;
      const x = ((arena[0].length - matrix[0].length) / 2) | 0;
      const spawn = { matrix, pos: { x, y: 0 } };
      if (collide(arena, spawn)) {
        setGameOver(true);
        setTimeout(onGameOver, 3000);
      } else {
        setPlayer((p) => ({ ...p, pos: spawn.pos, matrix, color }));
      }
      return { matrix: randomPiece(), color: randomColor() };
    });
  }

  const playerMove = (dir) => {
    if (pausedRef.current || countdown > 0) return;
    const p = playerRef.current,
      pos = { x: p.pos.x + dir, y: p.pos.y };
    if (!collide(arena, { matrix: p.matrix, pos }))
      setPlayer((p) => ({ ...p, pos }));
  };
  const playerDrop = () => {
    if (pausedRef.current || countdown > 0) return;
    const p = playerRef.current,
      pos = { x: p.pos.x, y: p.pos.y + 1 };
    if (!collide(arena, { matrix: p.matrix, pos }))
      setPlayer((p) => ({ ...p, pos }));
    else {
      merge(arena, p);
      arenaSweep();
      playerReset();
    }
  };
  const rotatePlayer = (dir) => {
    if (pausedRef.current || countdown > 0) return;
    const p = playerRef.current;
    const cloned = p.matrix.map((r) => [...r]);
    rotate(cloned, dir);
    if (!collide(arena, { matrix: cloned, pos: p.pos }))
      setPlayer((p) => ({ ...p, matrix: cloned }));
  };

  function arenaSweep() {
    let count = 1;
    outer: for (let y = arena.length - 1; y >= 0; y--) {
      for (let x = 0; x < arena[y].length; x++)
        if (arena[y][x] == null) continue outer;
      arena.splice(y, 1);
      arena.unshift(Array(10).fill(null));
      setPlayer((p) => ({ ...p, score: p.score + count * 10 }));
      count *= 2;
      y++;
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current,
      ctx = canvas.getContext("2d");
    let lastTime = 0;
    function update(time = 0) {
      const over = overRef.current,
        paused = pausedRef.current;
      const delta = time - lastTime;
      lastTime = time;
      if (!over && !paused && countdown === 0) {
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
      if (countdown > 0) renderOverlay(ctx, String(countdown));
      else if (paused) renderOverlay(ctx, "Paused");
      else if (over) renderOverlay(ctx, "Game Over!");
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
    requestAnimationFrame(update);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [onGameOver, countdown]);

  function renderOverlay(ctx, text) {
    ctx.fillStyle = "#222";
    ctx.fillRect(20, 180, 160, 40);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 180, 160, 40);
    ctx.fillStyle = "#fff";
    ctx.font = "20px 'Pixelify Sans'";
    ctx.textBaseline = "middle";
    const m = ctx.measureText(text);
    ctx.fillText(text, (ctx.canvas.width - m.width) / 2, ctx.canvas.height / 2);
  }

  return (
    <div
      className="game-container"
      style={{ position: "relative", width: 200 }}
    >
      {/* Rules + Pause grouped */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: -180,
          width: 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: "100%",
            padding: 8,
            background: "#222",
            border: "2px solid #555",
            color: "#fff",
            fontSize: 14,
            lineHeight: 1.4,
            fontFamily: "Pixelify Sans",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, marginBottom: 6, fontWeight: "bold" }}>
            -Rules-
          </p>
          <div>
            ← / →:
            <br />
            Move Left/Right
          </div>
          <div style={{ marginTop: 4 }}>
            Z / X:
            <br />
            Rotate CCW/CW
          </div>
          <div style={{ marginTop: 4 }}>
            ↓:
            <br />
            Quick Drop
          </div>
          <div style={{ marginTop: 4 }}>
            P:
            <br />
            Pause
          </div>
          <div style={{ marginTop: 4 }}>
            Score:
            <br />
            10 × 2ⁿ⁻¹
          </div>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          style={{
            width: "100%",
            padding: 6,
            background: "#333",
            border: "1px solid #555",
            color: "#fff",
            fontSize: 16,
            fontFamily: "Pixelify Sans",
            cursor: "pointer",
          }}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      {/* Main board */}
      <canvas ref={canvasRef} width={200} height={400} />

      {/* Next preview */}
      <div
        className="next-box"
        style={{
          position: "absolute",
          top: 0,
          right: -100,
          width: 80,
          textAlign: "center",
        }}
      >
        <p style={{ fontFamily: "Pixelify Sans" }}>Next</p>
        <canvas ref={nextRef} width={80} height={80} />
      </div>

      {/* Score */}
      <div
        style={{
          position: "absolute",
          top: 410,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff",
          fontSize: 16,
          fontFamily: "Pixelify Sans",
        }}
      >
        Score: {player.score}
      </div>

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          top: 440,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {[
          { on: () => playerMove(-1), txt: "←" },
          { on: () => rotatePlayer(-1), txt: "⟲" },
          { on: () => playerDrop(), txt: "↓" },
          { on: () => rotatePlayer(1), txt: "⟳" },
          { on: () => playerMove(1), txt: "→" },
        ].map((b, i) => (
          <button
            key={i}
            onPointerDown={b.on}
            style={{
              width: 40,
              height: 40,
              background: "#333",
              border: "1px solid #555",
              color: "#fff",
              fontSize: 16,
              fontFamily: "Pixelify Sans",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {b.txt}
          </button>
        ))}
      </div>
    </div>
  );
}
