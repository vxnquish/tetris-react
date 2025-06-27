import React from "react";

export default function Score({ score = 0 }) {
  return <div className="score">Score: {score}</div>;
}
