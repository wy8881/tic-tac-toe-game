const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const {MatchmakingQueue} = require('./game/matchmaking')
const {
  checkWin,
  checkDraw,
  isValidMove,
  createBoard,
  getGameStatus,
  WINNING_LINES
} = require('./game/gameLogic')
const logger = require('./game/logger')

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const matchmaking = new MatchmakingQueue()

io.on('connection', (socket) => {
  logger.info({socketId: socket.id}, 'A user connected')
  
  socket.on('join-game', (playerName) => {
    logger.info({socketId: socket.id, playerName}, 'Player joined game')
    
    const player = {
      id: socket.id,
      name: playerName,
      socket: socket
    }
    
    const result = matchmaking.addPlayer(player);

    if (result.matched) {
      logger.info({socketId: socket.id, playerName}, 'Player matched with another player')

      const game = result.game;
      const gameId = game.id;
      game.players.X.socket.join(gameId);
      game.players.O.socket.join(gameId);
      io.to(gameId).emit('game-start', {
        gameId: gameId,
        players: {
          X: game.players.X.name,
          O: game.players.O.name
        },
        board: game.board,
        currentTurn: game.currentTurn,
      });
      game.players.X.socket.emit('your-symbol', {symbol: 'X'});
      game.players.O.socket.emit('your-symbol', {symbol: 'O'});
      logger.info({socketId: socket.id, playerName}, 'Game started')
    } else {
      socket.emit('waiting-for-match', {
        message: 'Waiting for a match...',
        position: result.position
      });
      logger.info({socketId: socket.id, playerName}, 'Waiting for a match')
    }
  })

  socket.on('make-move',({gameId, position})=>{
    logger.info({socketId: socket.id, gameId, position}, 'Player made a move')
    const game = matchmaking.getGame(gameId);
    if (!game) {
      socket.emit('error', {message: 'Game not found'})
      logger.error({socketId: socket.id, gameId, position}, 'Game not found')
      return;
    }
    const playerSymbol = matchmaking.getPlayerSymbol(gameId, socket.id);
    if (!playerSymbol) {
      socket.emit('error', {message: 'you are not a player in this game'})
      logger.error({socketId: socket.id, gameId, position}, 'you are not a player in this game')
      return;
    }
    if (game.currentTurn !== playerSymbol) {
      socket.emit('error', {message: 'Not your turn'})
      logger.error({socketId: socket.id, gameId, position}, 'Not your turn')
      return;
    }
    if (!isValidMove(game.board, position)) {
      socket.emit('error', {message: 'Invalid move'})
      logger.error({socketId: socket.id, gameId, position}, 'Invalid move')
      return;
    }
    matchmaking.updateBoard(gameId, position, playerSymbol);
    const gameStatus = getGameStatus(game.board);
    if (gameStatus.status === 'won') {
      matchmaking.setGameStatus(gameId, 'won', gameStatus.winnerSymbol);
      io.to(gameId).emit('game-over', {
        winner: game.players[gameStatus.winnerSymbol].name,
        board: game.board
      })
      logger.info({socketId: socket.id, gameId, position}, 'Game over')
      matchmaking.removeGame(gameId);
      return
    }
    if (gameStatus.status === 'draw') {
      matchmaking.setGameStatus(gameId, 'draw');
      io.to(gameId).emit('game-over', {
        winner: 'draw',
        board: game.board
      })
      logger.info({socketId: socket.id, gameId, position}, 'Game over')
      matchmaking.removeGame(gameId);
      return;
    }

    matchmaking.switchTurn(gameId);

    io.to(gameId).emit('board-update', {
      board: game.board,
      currentTurn: game.currentTurn,
      lastMove: {
        position: position,
        player: playerSymbol
      }
    })
    logger.info({socketId: socket.id, gameId, position}, 'Board updated')
  })

  socket.on('disconnect', ({gameId}) => {
    logger.info({socketId: socket.id, gameId}, 'Player disconnected')
    matchmaking.removeWaitingPlayer(socket.id);
    const game = matchmaking.findGameByPlayerId(socket.id);
    if (game) {
      io.to(gameId).emit('opponent-left', {
        message: 'Your opponent has disconnected'
      })
      matchmaking.removeGame(gameId);
      return;
    }
  })
})

app.get('/',(req, res) => {
  res.json({
    message:'Tic-Tac-Toe Server',
    status: 'online',
    stats: matchmaking.getStats()
  })
})

app.get('/health',(req, res) => {
  res.json({status:'healthy'})
})

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
})




