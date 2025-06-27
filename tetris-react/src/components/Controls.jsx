import React from "react";

export default function Controls({ onMove, onRotate, onDrop }) {
  return (
    <div className="controls">
      <button onClick={() => onMove(-1)}>←</button>
      <button onClick={() => onRotate(-1)}>⟲</button>
      <button onClick={() => onRotate(1)}>⟳</button>
      <button onClick={() => onMove(1)}>→</button>
      <button onClick={onDrop}>↓</button>
    </div>
  );
}
