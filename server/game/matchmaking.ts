import { createBoard } from './gameLogic.js'
import { Player, Game, GameStatus, Symbol, GameState, Room, RoomChoice, RematchChoice } from '../type.js'
import logger from './logger.js'
class MatchmakingService {
    private waitingPlayers: Player[]
    private rooms: Map<string, Room>
    private rematchChoices: Map<string, RoomChoice>

    constructor() {
        this.waitingPlayers = []
        this.rooms = new Map()
        this.rematchChoices = new Map()
    }
    generateRoomCode(): string {
        return Math.random().toString(36).substr(2, 6).toUpperCase()
    }

    joinRoom(code: string, player: Player): { matched: boolean; room:Room; position: number } {
        let room = this.rooms.get(code)
        if (!room) {
            const room: Room = {
                code: code,
                players: [player],
                game: undefined
            }
            this.rooms.set(code, room)
            return { matched: false, room: room, position: 1 }
        }

        if (room.players.length >= 2) {
            throw new Error('Room is full')
        }

        room.players.push(player)
        return { matched: true, room: room, position:2 }
    }

    quickMatch(player: Player): { matched: boolean; room?: Room} {
        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift()!;
            const roomCode = this.generateRoomCode()
            const room:Room = {
                code: roomCode,
                players: [opponent, player],
                game: undefined
            }
            this.rooms.set(roomCode, room)
            return { matched: true, room: room }
        }
        this.waitingPlayers.push(player)
        return { matched: false }
    }


    createGame(player1: Player, player2: Player): Game {
        const game: Game = {
            playerSymbols: {
                X: player1.id,
                O: player2.id
            },
            board: createBoard(),
            currentTurn: 'X',
            state: 'playing',
            winner: null,
            createdAt: new Date()
        }
        return game
    }

    addPlayer(player: Player): { matched: true; game: Game; room: Room } | { matched: false; position: number } {
        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift()!;
            const game = this.createGame(opponent, player);
            const roomCode = this.generateRoomCode();
            const room: Room = {
                code: roomCode,
                players: [opponent, player],
                game: game
            };
            this.rooms.set(roomCode, room);
            return {
                matched: true,
                game: game,
                room: room
            };
        } else {
            this.waitingPlayers.push(player);
            return {
                matched: false,
                position: this.waitingPlayers.length
            };
        }
    }

    getGameByRoomCode(roomCode: string): Game | undefined {
        const room = this.rooms.get(roomCode);
        if (!room) return undefined;
        return room.game;
    }

    getRoomByRoomCode(roomCode: string): Room | undefined {
        return this.rooms.get(roomCode);
    }

    getRoomByPlayerId(playerId: string): Room | undefined {
        for (const room of this.rooms.values()) {
            if (room.players.some(player => player.id === playerId)) {
                return room;
            }
        }
        return undefined;
    }       

    removeWaitingPlayer(playerId: string): boolean {
        const index = this.waitingPlayers.findIndex(player => player.id === playerId);
        if (index !== -1) {
            this.waitingPlayers.splice(index, 1);
            return true;
        }
        return false;
    }

    getPlayerSymbol(roomCode: string, playerId: string): Symbol | null {
        const room = this.rooms.get(roomCode);
        if (!room || !room.game) return null;
        const game = room.game;
        if (game.playerSymbols.X === playerId) return 'X';
        if (game.playerSymbols.O === playerId) return 'O';
        return null;
    }

    updateBoard(roomCode: string, position: number, symbol: Symbol): boolean {
        const game = this.getGameByRoomCode(roomCode);
        if (!game) return false;
        game.board[position] = symbol;
        return true;
    }

    switchTurn(roomCode: string): boolean {
        const game = this.getGameByRoomCode(roomCode);
        if (!game) return false;
        game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
        return true;
    }
    
    setGameStatus(roomCode: string, state: GameState, winner: Symbol | null = null): boolean {
        const game = this.getGameByRoomCode(roomCode);
        if (!game) return false;
        game.state = state;
        if (winner) {
            game.winner = winner;
        }
        return true;
    }

    getStats() {
        return {
            waitingPlayers: this.waitingPlayers.length,
            activeRooms: this.rooms.size,
            totalPlayers: this.waitingPlayers.length + this.rooms.size * 2,
        }
    }

    handleRematchChoice(roomCode: string, playerId: string, choice: RematchChoice): void {
        if (!this.rematchChoices.has(roomCode)) {
            this.rematchChoices.set(roomCode, {})
        }
        const choices = this.rematchChoices.get(roomCode)!;
        choices[playerId] = choice;
    }

    checkRematchReady(roomCode: string): { ready: boolean; bothContinue: boolean } {
        const choices = this.rematchChoices.get(roomCode);
        if (!choices) return { ready: false, bothContinue: false };
        const values = Object.values(choices);
        if (values.length !== 2) return { ready: false, bothContinue: false };
        const bothContinue = values.every(choice => choice === 'continue');
        return {ready: true, bothContinue: bothContinue }
    }

    resetGameForRematch(roomCode: string): boolean {
        logger.info({roomCode}, 'Resetting game for rematch')
        const room = this.rooms.get(roomCode);
        if (!room?.game) return false;
        const game = room.game;
        [game.playerSymbols.X, game.playerSymbols.O] = [game.playerSymbols.O, game.playerSymbols.X];
        game.board = createBoard();
        game.currentTurn = 'X';
        game.state = 'playing';
        game.winner = null;
        game.createdAt = new Date();
        this.rematchChoices.delete(roomCode);
        return true;
    }

    removeRoom(roomCode: string): boolean {
        const room = this.rooms.get(roomCode);
        if (!room) return false;
        if (!room?.game) {
            room.game = undefined;
        }
        return this.rooms.delete(roomCode);
    }
}

export { MatchmakingService }
