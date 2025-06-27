# vxnquish's Tetris Game

A modern, accessible Tetris-like game built with **React** and **HTML5 Canvas**, featuring a high-contrast color palette, intuitive controls, and mobile-friendly touch buttons.

---

## 📋 Features

- **High-Contrast Palette:** Easy to distinguish pieces for better visibility.
- **Countdown Start:** 3-second pre-game countdown.
- **Next Piece Preview:** See the upcoming tetromino in the sidebar.
- **Pause / Resume:** Toggle anytime with `p` or on-screen button.
- **Quick Restart:** Restart the game with confirmation.
- **Scoring System:** 10 × 2ⁿ⁻¹ points per cleared row.
- **Keyboard & Touch Controls:** Supports desktop and mobile browsers.

---

## 🎮 Rules & Controls

-Rules-

| Action            | Input            |
| ----------------- | ---------------- |
| Move Left / Right | `←` / `→`        |
| Rotate CCW / CW   | `Z` / `X`        |
| Quick Drop        | `↓`              |
| Pause / Resume    | `P`              |
| Restart Game      | On-screen button |
| Scoring system    | 10 × 2ⁿ⁻¹ points |

---

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/vxnquish/tetris-react.git
cd tetris-react

# Install dependencies
npm install
# or
yarn install
```

### Running Locally

```bash
# Start the development server
npm start
# or
yarn start
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play.

### Building for Production

```bash
npm run build
# or
yarn build
```

The optimized files will be in the `build/` folder.

---

## 🛠️ Tech Stack

- **Framework:** React
- **Rendering:** HTML5 Canvas API
- **Language:** JavaScript
- **Styling:** Inline CSS & custom pixel font ("Pixelify Sans")

---

## 📁 Project Structure

```
src/
├── components/
│   └── Board.jsx      # Main game logic & rendering
├── main.jsx           # React entry point
└── index.css          # Global styles (App, buttons, layout)
```

---

## 🎉 Contributions

Feel free to open issues or submit pull requests to add features, fix bugs, or improve accessibility.

---

## 📜 License

-