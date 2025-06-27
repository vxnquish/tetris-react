// src/components/NextPiece.jsx
import React, { useRef, useEffect } from "react";
import { COLORS } from "./Board";

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

export default function NextPiece({ piece }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.scale(20, 20);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(ctx, piece, { x: 1, y: 1 });
  }, [piece]);

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={80}
      style={{ background: "#222" }}
    />
  );
}
