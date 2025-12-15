const {createBoard} = require('./gameLogic')

class MatchmakingQueue {
    constructor() {
        this.waitingPlayers = []
        this.games = new Map()
    }

    generateGameId(){
        return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    createGame(player1, player2){
        const gameId = this.generateGameId()

        const game = {
            id: gameId,
            players: {
                X: {
                    id: player1.id,
                    name: player1.name,
                    socket: player1.socket
                },
                O: {
                    id: player2.id,
                    name: player2.name,
                    socket: player2.socket
                }
            },
            board: createBoard(),
            currentTurn: 'X',
            status: 'playing',
            winner: null,
            turns: []
        }

        this.games.set(gameId, game)
        return game
    }

    addPlayer(player){
        if (this.waitingPlayers.length > 0) {
            const oppenent = this.waitingPlayers.shift();
            const game = this. createGame(oppenent, player);
            return {
                matched: true,
                game: game
            };
        } else {
            this.waitingPlayers.push(player);
            return {
                matched: false,
                position: this.waitingPlayers.length
            };
        }
    }

    getGame(gameId){
        return this.games.get(gameId)
    }       

    removeGame(gameId){
        this.games.delete(gameId);
    }

    removeWaitingPlayer(playerId){
        const index = this.waitingPlayers.findIndex(player => player.id === playerId);
        if (index !== -1) {
            this.waitingPlayers.splice(index, 1);
            return true;
        }
        return false;
    }

    findGameByPlayerId(playerId) {
        for (const [gameId, game] of this.games.entries()) {
            if (game.players.X.id === playerId || game.players.O.id === playerId) {
                return game;
            }
        }
        return null;
    }

    getPlayerSymbol(gameId, playerId){
        const game = this.getGame(gameId);
        if (!game) return null;
        if (game.players.X.id === playerId) return 'X';
        if (game.players.O.id === playerId) return 'O';
        return null;
    }

    updateBoard(gameId, position, symbol) {
        const game = this.getGame(gameId);
        if (!game) return false;
        game.board[position]=symbol;
        return true;
    }

    switchTurn(gameId) {
        const game = this.getGame(gameId);
        if (!game) return false;
        game.currentTurn = game.currentTurn === 'X' ? 'O' : 'X';
        return true;
    }
    
    setGameStatus(gameId, status, winnerSymbol = null) {
        const game = this.getGame(gameId);
        if (!game) return false;
        game.status = status;
        if (winner) {
            game.winnerSymbol = winnerSymbol;
        }
        return true;
    }

    getStats() {
        return {
            waitingPlayers: this.waitingPlayers.length,
            activeGames: this.games.size,
            totalPlayers: this.waitingPlayers.length + this.games.size * 2,
        }
    }
}

module.exports = {MatchmakingQueue};