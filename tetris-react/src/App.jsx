// src/App.jsx
import React, { useState } from "react";
import Board from "./components/Board";

export default function App() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="App">
      {playing ? (
        <Board onGameOver={() => setPlaying(false)} />
      ) : (
        <div className="home-container">
          <h1>Tetris Game</h1>
          <button className="play-button" onClick={() => setPlaying(true)}>
            Play Game
          </button>
        </div>
      )}
    </div>
  );
}
