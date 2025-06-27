import React, { useRef, useEffect, useState } from "react";

export default function Board() {
  const canvasRef = useRef(null);
  // here you’ll set up your game loop, state, drawing, collision, etc.

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.scale(20, 20);
    // init arena, player, update loop...
  }, []);

  return <canvas ref={canvasRef} width={240} height={480} />;
}
