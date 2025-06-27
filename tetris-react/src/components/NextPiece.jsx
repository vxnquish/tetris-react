import React, { useRef, useEffect } from "react";

export default function NextPiece({ piece }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.scale(20, 20);
    // draw the next piece matrix here
  }, [piece]);

  return <canvas ref={canvasRef} width={80} height={80} />;
}
