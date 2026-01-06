import { Server } from 'socket.io'
import { MatchmakingService } from './matchmaking.js'
import { isValidMove, getGameStatus } from './gameLogic.js'
import { Player, Room, RematchChoice } from '../type.js'
import validator from 'validator'
import logger from './logger.js'
import type { BotDifficulty } from './botPlayer.js'
import type { Symbol } from '../type.js'

function startGame(room: Room, matchmaking: MatchmakingService): void {
  if (room.botPlayer) {
    const game = matchmaking.createGame(room.players[0], room.botPlayer);
  }
  else {
    const game = matchmaking.createGame(room.players[0], room.players[1])
    room.game = game;
    const roomCode = room.code;
    room.players.forEach(player => {
      player.socket.join(roomCode);
    })
  }
}

function notifyGameStart(roomCode:string, io: Server, matchmaking:MatchmakingService, logger:any): void {
  const room = matchmaking.getRoomByRoomCode(roomCode);
  if (!room?.game) return;
  const game = room.game;
  logger.info({roomCode, game: JSON.stringify(game)}, 'Game started')
  if (room.botPlayer) {
    io.to(roomCode).emit('game-start', {
      roomCode: roomCode,
      players: {
        X: room.players[0].name,
        O: 'Bot'
      },
      board: game.board,
      currentTurn: game.currentTurn,
    })
    room.players[0].socket.emit('your-symbol', {symbol: 'X'});
  } else {
    io.to(roomCode).emit('game-start', {
      roomCode: roomCode,
      players: {
        X: room.players.find(p => p.id === game.playerSymbols.X)?.name,
        O: room.players.find(p => p.id === game.playerSymbols.O)?.name
      },
      board: game.board,
      currentTurn: game.currentTurn,
    })
    room.players.find(p => p.id === game.playerSymbols.X)?.socket.emit('your-symbol', {symbol: 'X'});
    room.players.find(p => p.id === game.playerSymbols.O)?.socket.emit('your-symbol', {symbol: 'O'});
  }
}

function safeHandler(socket: any, handler: (...args: any[]) => void | Promise<void>) {
  return async (...args: any[]) => {
    try {
      await handler(...args);
    } catch (error) {
      logger.error({ error }, 'Error in socket handler');
      socket.emit('error', { message: 'An error occurred' });
    }
  };
}

function checkPlayerName(playerName: string): {valid: boolean, message?: string, escapedName?: string} {
  if (!playerName || typeof playerName !== 'string') {
    return {valid: false, message: 'Player name is required and must be a string'};
  }
  const trimmedName = playerName.trim();
  const escapedName = validator.escape(trimmedName);
  if (escapedName.length < 1 || escapedName.length > 10) {
    return {valid: false, message: 'Player name must be between 1 and 10 characters'};
  }
  return {valid: true, escapedName: escapedName};
}

export function setupGameHandlers(io: Server, matchmaking: MatchmakingService, logger: any): void {

  const MAX_CONNECTIONS = 100;
  let currentConnections = 0;
  io.use((socket, next) => {
    if (currentConnections >= MAX_CONNECTIONS) {
      return next(new Error('Server is at maximum capacity'));
    }
    next();
  });

  io.on('connection', (socket) => {
    logger.info({socketId: socket.id}, 'A user connected')
    currentConnections++;
    logger.info({currentConnections}, 'Current connections')

    socket.on('quick-match', safeHandler(socket, (playerName:string)=> {
      if (!playerName || typeof playerName !== 'string') {
        socket.emit('error', { message: 'Player name is required and must be a string' })
        logger.error({socketId: socket.id, playerName}, 'Invalid player name type')
        return;
      }
      const {valid, message, escapedName} = checkPlayerName(playerName);
      if (!valid) {
        socket.emit('error', { message: message })
        logger.error({socketId: socket.id, playerName}, 'Invalid player name', {message})
        return;
      }
      if (!escapedName) {
        socket.emit('error', { message: 'Player name is required and must be a string' })
        logger.error({socketId: socket.id, playerName}, 'Invalid player name', {message})
        return;
      }
      logger.info({socketId: socket.id, playerName: escapedName}, 'Player joined quick match')
      const player: Player = {
        id: socket.id,
        name: escapedName,
        socket: socket
      }
      const result = matchmaking.quickMatch(player);
      if (result.matched && result.room) {
        matchmaking.updateRoomActivity(result.room.code);
        startGame(result.room, matchmaking);
        notifyGameStart(result.room.code, io, matchmaking, logger);
      } else {
        socket.emit('waiting-for-match', {
          message: 'Waiting for a match...',
        });
        logger.info({socketId: socket.id, playerName: escapedName}, 'Waiting for a match')
      }

    }))

    socket.on('join-room', safeHandler(socket, ({playerName, roomCode}: {playerName:string, roomCode:string}) => {
      matchmaking.updateRoomActivity(roomCode);
      if (!roomCode || typeof roomCode !== 'string') {
        socket.emit('error', { message: 'Room code is required and must be a string' })
        logger.error({socketId: socket.id, playerName, roomCode}, 'Invalid room code type')
        return;
      }

      if (!validator.isAlphanumeric(roomCode)) {
        socket.emit('error', { message: 'Room code must contain only alphanumeric characters' })
        logger.error({socketId: socket.id, playerName, roomCode}, 'Invalid room code format')
        return;
      }

      if (roomCode.length !== 6) {
        socket.emit('error', { message: 'Room code must be exactly 6 characters' })
        logger.error({socketId: socket.id, playerName, roomCode}, 'Invalid room code length')
        return;
      }
      const {valid, message, escapedName} = checkPlayerName(playerName);
      if (!valid && message) {
        socket.emit('error', { message: message })
        logger.error({socketId: socket.id, playerName, roomCode}, 'Invalid player name', {message})
        return;
      }
      if (!escapedName) {
        socket.emit('error', { message: 'Player name is required and must be a string' })
        logger.error({socketId: socket.id, playerName, roomCode}, 'Invalid player name', {message})
        return;
      }
      logger.info({socketId: socket.id, playerName: escapedName, roomCode}, 'Player joined room')
      const player: Player = {
        id: socket.id,
        name: escapedName,
        socket: socket
      }
      try {
        const result = matchmaking.joinRoom(roomCode, player);
        if (result.matched && result.room) {
          startGame(result.room, matchmaking);
          notifyGameStart(result.room.code, io, matchmaking, logger);
        } else {
          socket.emit('waiting-in-room', {
            message:"Waiting for your friend to join...",
            roomCode: result.room?.code
          })
          logger.info({socketId: socket.id, playerName: escapedName, roomCode}, 'Waiting for your friend to join...')
        }
      } catch (error) {
        socket.emit('error', {
          message:(error as Error).message
        })
        logger.error({socketId: socket.id, playerName: escapedName, roomCode}, 'Error joining room', {error})
      }
    }))

    socket.on("play-with-bot", safeHandler(socket, ({playerName, difficulty}: {playerName: string, difficulty: BotDifficulty}) =>{
      const {valid, message, escapedName} = checkPlayerName(playerName);
      if (!valid && message) {
        socket.emit('error', { message: message })
        logger.error({socketId: socket.id, playerName}, 'Invalid player name', {message})
        return;
      }
      if (!escapedName) {
        socket.emit('error', { message: 'Player name is required and must be a string' })
        return;
      }
      logger.info({socketId: socket.id, playerName: escapedName, difficulty}, 'Player joined bot game')
      const player: Player = {
        id: socket.id,
        name: escapedName,
        socket: socket
      }
      if (!difficulty || typeof difficulty !== 'string') {
        socket.emit('error', { message: 'Difficulty is required and must be a string' })
        logger.error({socketId: socket.id, playerName, difficulty}, 'Invalid difficulty type')
        return;
      }

      if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
        socket.emit('error', { message: 'Invalid difficulty' })
        logger.error({socketId: socket.id, playerName, difficulty}, 'Invalid difficulty')
        return;
      }

      const result = matchmaking.playWithBot(player, difficulty);
      if (result.matched && result.room) {
        startGame(result.room, matchmaking);
        notifyGameStart(result.room.code, io, matchmaking, logger);
      } else {
        socket.emit('error', {
          message: 'Error playing with bot',
        });
        logger.error({socketId: socket.id, playerName: escapedName}, 'Error playing with bot')
      }
    }))

    socket.on('make-move', safeHandler(socket, ({roomCode, position}: {roomCode: string, position: number})=>{
      matchmaking.updateRoomActivity(roomCode);
      logger.info({socketId: socket.id, roomCode, position}, 'Player made a move')
      const room = matchmaking.getRoomByRoomCode(roomCode);
      if (!room || !room.game) {
        socket.emit('error', {message: 'Game not found'})
        logger.error({socketId: socket.id, roomCode, position}, 'Game not found')
        return;
      }
      const game = room.game;
      const playerSymbol = matchmaking.getPlayerSymbol(room.code, socket.id);
      if (!playerSymbol) {
        socket.emit('error', {message: 'you are not a player in this game'})
        logger.error({socketId: socket.id, roomCode, position}, 'you are not a player in this game')
        return;
      }
      if (game.currentTurn !== playerSymbol) {
        socket.emit('invalid-turn', {message: 'Not your turn'})
        logger.error({socketId: socket.id, roomCode, position}, 'Not your turn')
        return;
      }
      if (!isValidMove(game.board, position)) {
        socket.emit('invalid-turn', {message: 'Invalid move'})
        logger.error({socketId: socket.id, roomCode, position}, 'Invalid move')
        return;
      }
      matchmaking.updateBoard(roomCode, position, playerSymbol);
      const gameStatus = getGameStatus(game.board);
      if (gameStatus.state === 'won') {
        matchmaking.setGameStatus(roomCode, 'won', gameStatus.winner);
        
        const winnerSymbol = gameStatus.winner!;
        const winnerPlayerId = game.playerSymbols[winnerSymbol];
        const winnerPlayer = room.players.find(p => p.id === winnerPlayerId);
        const winnerName = winnerPlayer ? winnerPlayer.name : 'Unknown';
        
        io.to(roomCode).emit('game-over', {
          winner: winnerName,
          board: game.board
        })
        logger.info({socketId: socket.id, roomCode, position}, 'Game over')
        return
      }
      if (gameStatus.state === 'draw') {
        matchmaking.setGameStatus(roomCode, 'draw');
        io.to(roomCode).emit('game-over', {
          winner: 'draw',
          board: game.board
        })
        logger.info({socketId: socket.id, roomCode, position}, 'Game over')
        room.game = undefined;
        return;
      }

      matchmaking.switchTurn(roomCode);

      io.to(roomCode).emit('board-update', {
        board: game.board,
        currentTurn: game.currentTurn,
        lastMove: {
          position: position,
          player: playerSymbol
        }
      })
      logger.info({socketId: socket.id, roomCode, position}, 'Board updated')
      if (room.botPlayer) {
        const botMove = room.botPlayer.calculateMove(game.board, game.currentTurn);
        let botSymbol = null;
        if (game.playerSymbols.O === "BOT") {
          botSymbol = "O" as Symbol;
        } else {
          botSymbol = "X" as Symbol;
        }
        if (!botSymbol) {
          socket.emit('error', {message: 'Bot symbol not found'})
          logger.error({socketId: socket.id, roomCode, position}, 'Bot symbol not found')
          return;
        }
        matchmaking.updateBoard(roomCode, botMove, botSymbol);
        const gameStatus = getGameStatus(game.board);
        if (gameStatus.state === 'won') {
          matchmaking.setGameStatus(roomCode, 'won', gameStatus.winner);
          const winnerSymbol = gameStatus.winner;
          if (winnerSymbol === botSymbol) {
            io.to(roomCode).emit('game-over', {
              winner: 'Bot',
              board: game.board
            })
            logger.info({socketId: socket.id, roomCode, position}, 'Game over')
            return;
          }else {
            const winnerName = room.players.find(p => p.id !== socket.id)?.name;
            io.to(roomCode).emit('game-over', {
              winner: winnerName,
              board: game.board
            })
            logger.info({socketId: socket.id, roomCode, position}, 'Game over')
            return;
          }
        }
        if (gameStatus.state === 'draw') {
          matchmaking.setGameStatus(roomCode, 'draw');
          io.to(roomCode).emit('game-over', {
            winner: 'draw',
            board: game.board
          })
          logger.info({socketId: socket.id, roomCode, position}, 'Game over')
          return;
        }
        matchmaking.switchTurn(roomCode);
        io.to(roomCode).emit('board-update', {
          board: game.board,
          currentTurn: game.currentTurn,
          lastMove: {
            position: botMove,
            player: botSymbol
          }
        })
        logger.info({socketId: socket.id, roomCode, position}, 'Board updated')
      }
    }))

    socket.on('rematch-request', safeHandler(socket, ({roomCode, choice}: {roomCode: string, choice: RematchChoice}) =>{
      matchmaking.updateRoomActivity(roomCode);
      logger.info({socketId: socket.id, roomCode, choice}, 'Rematch request')
      const room = matchmaking.getRoomByRoomCode(roomCode);
      if(!room) {
        socket.emit('error', {message: 'Room not found'})
        return
      }

      matchmaking.handleRematchChoice(roomCode, socket.id, choice);
      if (choice === 'leave') {
        io.to(roomCode).emit('opponent-left', {
          message: 'Your opponent has left the game'
        })
        room.players.forEach(player => {
          player?.socket?.disconnect();
        })
        matchmaking.removeRoom(roomCode);
        return;
      }
      if (room.botPlayer && choice === 'continue') {
        logger.info({socketId: socket.id, roomCode, choice}, 'Player continued with bot')
        matchmaking.resetGameForRematch(roomCode);
        notifyGameStart(roomCode, io, matchmaking, logger);
        return;
      }

      const ready = matchmaking.checkRematchReady(roomCode);
      logger.info({socketId: socket.id, roomCode, ready}, 'Rematch Ready Check')
      if (!ready.ready) {
        const opponentId = room.players.find(p => p.id !== socket.id)?.id;
        if (opponentId) {
          io.to(opponentId).emit('opponent-waiting-rematch', {
            message: 'Your opponent is waiting for your rematch decision'
          })
          logger.info({socketId: socket.id, roomCode, choice}, 'Waiting for opponent decision')
          io.to(socket.id).emit('waiting-for-oppenent-decision', {
            message: 'You are waiting for your opponent to decide'
          })
          return;
        }
      }
      if (ready.bothContinue) {
        logger.info({socketId: socket.id, roomCode}, 'Both Rematch confirmed')
        matchmaking.resetGameForRematch(roomCode);
        notifyGameStart(roomCode, io, matchmaking, logger);
        return;
      }
    }))  

    socket.on('disconnect', safeHandler(socket, () => {
      logger.info({socketId: socket.id}, 'Player disconnected')
      currentConnections--;
      logger.info({currentConnections}, 'Current connections')
      matchmaking.removeWaitingPlayer(socket.id);
      const room = matchmaking.getRoomByPlayerId(socket.id);
      if (room && room.game) {
        io.to(room.code).emit('opponent-left', {
          message: 'Your opponent has disconnected'
        })
        room.game = undefined;
        return;
      }
    }))
  })
}