# GameZone

**🌐 Live Demo:** [https://gamezone-17uj.onrender.com/](https://gamezone-17uj.onrender.com/)

GameZone is a modern, full-stack web application featuring a curated collection of ten classic arcade and logic games. Built using a modern React frontend and a robust Express.js backend, the application provides a seamless, responsive gaming experience with persistent global leaderboards and adjustable difficulty modifiers.

## Architecture and Technology Stack

The project utilizes a decoupled client-server architecture.

**Frontend:**
- React 18
- Vite Build Tool
- React Router DOM (Declarative routing)
- Vanilla CSS 3 (Custom design system, CSS Variables for theming)

**Backend:**
- Node.js
- Express.js (REST API architecture)
- SQLite3 (Persistent file-based relational database)
- CORS Middleware

## Included Game Library

The platform includes ten fully functional games, each implemented with strict adherence to their respective official rulesets. 

1. **Checkers**: Authentic English Draughts rules implementation. Features mandatory capture enforcement, automated jump chaining, and a recursive Minimax algorithm for the computer opponent.
2. **Connect Four**: Classic vertical checker-dropping game. The automated opponent utilizes heuristics to block player wins and secure optimal center column control.
3. **Tic Tac Toe**: Incorporates a pure Minimax algorithm, ensuring the computer opponent is mathematically unbeatable on higher difficulties.
4. **Minesweeper**: Grid-based logic puzzle featuring algorithmic recursive flood-fill for empty cell revealing and correct end-game state visualizations.
5. **2048**: Sliding tile puzzle. Supports both keyboard bindings and touch events (swipe gestures) for mobile compatibility.
6. **Wordle**: Word deduction game. Incorporates real-time validation via external HTTP requests to the Free Dictionary API to parse authentic English vocabulary.
7. **Snake**: Canvas-based arcade game with coordinate tracking, continuous movement loops, and boundary collision detection.
8. **Hangman**: Multi-tiered vocabulary challenge. Enforces a strict 6-attempt maximum across all difficulties, adjusting the length and obscurity of the target strings.
9. **Memory Match**: Array shuffling and delayed un-mounting sequences for paired tile matching.
10. **Rock Paper Scissors**: Configurable state machine supporting best-of-N match structures with integrated sudden-death tiebreakers.

## Key Features

- **Algorithmic Opponents**: Turn-based games feature artificial intelligence scaled by difficulty.
- **Fair Play Turn Alternation**: AI games utilize decentralized randomized state tracking to alternate starting privileges upon successive rounds.
- **Persistent Leaderboards**: Centralized scoring system stores high scores asynchronously to a local SQLite database, allowing cross-session progression tracking.
- **Responsive Layouts**: User interfaces are designed using Flexbox and CSS Grid arrays to support standard desktop resolutions as well as mobile device viewports.

## Installation and Setup

### Prerequisites
- Node.js (v18.0.0 or later recommended)
- npm (Node Package Manager)

### 1. Repository Initialization
Clone the repository and navigate into the project root directory.

### 2. Backend Configuration
The Express backend requires standard package installation. Move to the root directory and install the necessary dependencies:

```bash
npm install
```

The SQLite database file (`database.sqlite`) will automatically initialize in the root directory upon server startup if it is not present.

### 3. Frontend Configuration
The React application resides within the `client` directory. Navigate into this folder and install the frontend dependencies:

```bash
cd client
npm install
```

## Running the Application

The project requires both the server and the client to run simultaneously to function correctly. It is recommended to use two terminal instances.

**Terminal 1 (Backend Server):**
From the root directory of the project:
```bash
npm start
```
The server will initialize on `http://localhost:3000`.

**Terminal 2 (Frontend Client):**
Navigate to the `client` directory:
```bash
cd client
npm run dev
```
Vite will initialize the development server, typically available at `http://localhost:5173`.

## System Structure 

```text
/
├── server.js               (Express server entry point and API routes)
├── database.sqlite         (Auto-generated relational database)
├── package.json            (Backend dependencies)
└── client/
    ├── package.json        (Frontend dependencies)
    ├── vite.config.js      (Vite configuration proxy settings)
    ├── index.html          (Base HTML template)
    └── src/
        ├── App.jsx         (Application root and Layout container)
        ├── main.jsx        (React DOM entry point)
        ├── index.css       (Global styling and design tokens)
        ├── pages/
        │   ├── HomePage.jsx  (Game library registry and navigation)
        │   └── GamePage.jsx  (Dynamic wrapper component for individual games)
        └── games/          (Individual React components per game)
            ├── 2048.jsx
            ├── Checkers.jsx
            └── ...
```

## API Documentation

The backend exposes a lightweight REST API for scoreboard management.

### GET `/api/scores/:gameId`
Returns the descending top 10 scores for a specified game.
- **Response Format**: `[{ id: INT, game_id: STRING, player_name: STRING, score: INT }]`

### POST `/api/scores`
Submits a new high score entry.
- **Payload Requirement**: `{ gameId: STRING, playerName: STRING, score: INT }`
- **Response**: `201 Created` or `400 Bad Request`

## License

This project is proprietary and intended for personal portfolio and demonstration purposes. All structural code and specific component logic were developed custom for this application.
