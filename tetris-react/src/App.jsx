import React from "react";
import Board from "./components/Board";
import NextPiece from "./components/NextPiece";
import Score from "./components/Score";
import Controls from "./components/Controls";
import "./index.css";

export default function App() {
  return (
    <div className="app">
      <div className="game-area">
        <Board />
        <div className="sidebar">
          <Score />
          <NextPiece />
          <Controls />
        </div>
      </div>
    </div>
  );
}
