# Online Tic-Tac-Toe Game
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff) ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=fff) ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=fff) ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=fff) ![Railway](https://img.shields.io/badge/Railway-0B0D0E?logo=railway&logoColor=fff)

An online Tic-Tac-Toe game with a Vite front end and a Node.js back end.  
Players can:

- Create or join rooms over the network  
- Match with other players online  
- Play multiple rounds in the same room  
- Choose to continue playing or leave after each match  

---

## Live Demo

- Frontend: https://tic-tac-toe.wyprojects.com  
- Backend health check: https://tic-tac-toe-backend.wyprojects.com/health  

Frontend is deployed on Vercel.  
Backend is deployed on Railway.

---

## Features

- Real-time multiplayer  
  Players can create rooms, join existing rooms, or match with others.

- Game flow  
  Each round clearly shows win / lose / draw.  
  After every game, players can either play again or leave the room.

- Front end  
  Built using Vite with a simple, responsive UI.

- Back end  
  Node.js handles rooms, connections, and game state using Socket.IO.

---

## Tech Stack

### Frontend
- Vite  
- TypeScript
- React-BootStrap
- Socket.IO client

### Backend
- Node.js  
- Socket.IO  
- Express

---

## Getting Started (Local Development)

### 1. Prerequisites
- Node.js (LTS recommended)  
- npm or yarn

### 2. Clone the project
```bash
git clone https://github.com/wy8881/tic-tac-toe-game.git
cd tic-tac-toe-game
```
### 3. Install dependencies   
   cd server  
   npm install  

   cd ../client  
   npm install  

### 4. Start the backend  
   cd server  
   npm run dev   (or: npm start)  

### 5. Start the frontend  
   cd client  
   npm run dev  

Open the browser (default Vite port is http://localhost:5173).

---

## How to Play

- Open the application in the browser.  
- Join a room using a Room ID, or use matchmaking.  
- Take turns placing X and O on the 3x3 grid.  
- After the game ends, select either Play Again or Leave Room.

---

## Project Structure

tic-tac-toe-game/  
├── client/       Frontend (Vite)  
├── server/       Backend (Node.js + Socket.IO)  
└── README.md  
