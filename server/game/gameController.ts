import { Server } from 'socket.io'
import { MatchmakingService } from './matchmaking.js'
import { isValidMove, getGameStatus } from './gameLogic.js'
import { Player, Room, RematchChoice } from '../type.js'


function startGame(room: Room, matchmaking: MatchmakingService): void {
  const game = matchmaking.createGame(room.players[0], room.players[1])
  room.game = game;
  const roomCode = room.code;
  room.players.forEach(player => {
    player.socket.join(roomCode);
  })

}

function notifyGameStart(roomCode:string, io: Server, matchmaking:MatchmakingService, logger:any): void {
  logger.info({roomCode}, 'Game started')
  const room = matchmaking.getRoomByRoomCode(roomCode);
  if (!room?.game) return;
  const game = room.game;
  io.to(roomCode).emit('game-start', {
    roomCode: roomCode,
    players: {
      X: room.players[0].name,
      O: room.players[1].name
    },
    board: game.board,
    currentTurn: game.currentTurn,
  })
  room.players[0].socket.emit('your-symbol', {symbol: 'X'});
  room.players[1].socket.emit('your-symbol', {symbol: 'O'});
}

export function setupGameHandlers(io: Server, matchmaking: MatchmakingService, logger: any): void {
  io.on('connection', (socket) => {
    logger.info({socketId: socket.id}, 'A user connected')

    socket.on('quick-match',(playerName:string)=> {
      logger.info({socketId: socket.id, playerName}, 'Player joined quick match')
      const player: Player = {
        id: socket.id,
        name: playerName,
        socket: socket
      }
      const result = matchmaking.quickMatch(player);
      if (result.matched && result.room) {
        startGame(result.room, matchmaking);
        notifyGameStart(result.room.code, io, matchmaking, logger);
      } else {
        socket.emit('waiting-for-match', {
          message: 'Waiting for a match...',
        });
        logger.info({socketId: socket.id, playerName}, 'Waiting for a match')
      }

    })

    socket.on('join-room', ({playerName, roomCode}: {playerName:string, roomCode:string}) => {
      logger.info({socketId: socket.id, playerName, roomCode}, 'Player joined room')
      const player: Player = {
        id: socket.id,
        name: playerName,
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
        logger.info({socketId: socket.id, playerName, roomCode}, 'Waiting for your friend to join...')
      }
      } catch (error) {
        socket.emit('error', {
          message:(error as Error).message
        })
        logger.error({socketId: socket.id, playerName, roomCode}, 'Error joining room', {error})
      }
    })

    socket.on('make-move',({roomCode, position}: {roomCode: string, position: number})=>{
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
        socket.emit('error', {message: 'Not your turn'})
        logger.error({socketId: socket.id, roomCode, position}, 'Not your turn')
        return;
      }
      if (!isValidMove(game.board, position)) {
        socket.emit('error', {message: 'Invalid move'})
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
    })

    socket.on('rematch-request', ({roomCode, choice}: {roomCode: string, choice: RematchChoice}) =>{
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
        matchmaking.removeRoom(roomCode);
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
          return;
        }
      }
      if (ready.bothContinue) {
        logger.info({socketId: socket.id, roomCode}, 'Both Rematch confirmed')
        matchmaking.resetGameForRematch(roomCode);
        notifyGameStart(roomCode, io, matchmaking, logger);
        return;
      }
    })  

    socket.on('disconnect', () => {
      logger.info({socketId: socket.id}, 'Player disconnected')
      matchmaking.removeWaitingPlayer(socket.id);
      const room = matchmaking.getRoomByPlayerId(socket.id);
      if (room && room.game) {
        io.to(room.code).emit('opponent-left', {
          message: 'Your opponent has disconnected'
        })
        room.game = undefined;
        return;
      }
    })
  })
}