import { MatchmakingService } from './matchmaking.js';

describe('MatchmakingService', () => {
  let matchmaking: MatchmakingService;

  beforeEach(() => {
    matchmaking = new MatchmakingService();
  });

  describe('addPlayer', () => {
    test('should add first player to waiting queue', () => {
      const player = { id: 'p1', name: 'Alice', socket: {} as any };
      const result = matchmaking.addPlayer(player);

      expect(result.matched).toBe(false);
      if (!result.matched) {
        expect(result.position).toBe(1);
      }
      expect(matchmaking['waitingPlayers']).toHaveLength(1);
    });

    test('should match two players immediately', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      expect(result.matched).toBe(true);
      if (result.matched) {
        expect(result.game).toBeDefined();
        expect(result.room).toBeDefined();
        expect(result.game.playerSymbols.X).toBe('p1');
        expect(result.game.playerSymbols.O).toBe('p2');
        expect(result.room.players[0].name).toBe('Alice');
        expect(result.room.players[1].name).toBe('Bob');
      }
      expect(matchmaking['waitingPlayers']).toHaveLength(0);
    });

    test('should assign X to first player and O to second', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        expect(result.game.playerSymbols.X).toBe('p1');
        expect(result.game.playerSymbols.O).toBe('p2');
        expect(result.game.currentTurn).toBe('X');
      }
    });
  });

  describe('createGame', () => {
    test('should create game with empty board', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      const game = matchmaking.createGame(player1, player2);

      expect(game.board).toEqual(Array(9).fill(null));
      expect(game.currentTurn).toBe('X');
      expect(game.state).toBe('playing');
    });

    test('should create game with correct player symbols', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      const game = matchmaking.createGame(player1, player2);

      expect(game.playerSymbols.X).toBe('p1');
      expect(game.playerSymbols.O).toBe('p2');
    });
  });

  describe('generateRoomCode', () => {
    test('should generate unique codes', () => {
      const code1 = matchmaking.generateRoomCode();
      const code2 = matchmaking.generateRoomCode();

      expect(code1).not.toBe(code2);
      expect(code1.length).toBe(6);
      expect(code2.length).toBe(6);
    });
  });

  describe('getGameByRoomCode', () => {
    test('should return game by room code', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const retrieved = matchmaking.getGameByRoomCode(result.room.code);
        expect(retrieved).toBe(result.game);
      }
    });

    test('should return undefined for non-existent room', () => {
      const retrieved = matchmaking.getGameByRoomCode('FAKE');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getRoomByRoomCode', () => {
    test('should return room by code', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const retrieved = matchmaking.getRoomByRoomCode(result.room.code);
        expect(retrieved).toBe(result.room);
      }
    });

    test('should return undefined for non-existent room', () => {
      const retrieved = matchmaking.getRoomByRoomCode('FAKE');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('removeRoom', () => {
    test('should remove room from map', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const removed = matchmaking.removeRoom(result.room.code);
        expect(removed).toBe(true);
        expect(matchmaking['rooms'].has(result.room.code)).toBe(false);
      }
    });
  });

  describe('removeWaitingPlayer', () => {
    test('should remove player from waiting queue', () => {
      const player = { id: 'p1', name: 'Alice', socket: {} as any };

      matchmaking.addPlayer(player);
      const removed = matchmaking.removeWaitingPlayer('p1');

      expect(removed).toBe(true);
      expect(matchmaking['waitingPlayers']).toHaveLength(0);
    });

    test('should return false if player not found', () => {
      const removed = matchmaking.removeWaitingPlayer('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('getRoomByPlayerId', () => {
    test('should find room for player X', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const found = matchmaking.getRoomByPlayerId('p1');
        expect(found).toBe(result.room);
      }
    });

    test('should find room for player O', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const found = matchmaking.getRoomByPlayerId('p2');
        expect(found).toBe(result.room);
      }
    });

    test('should return undefined if player not in any room', () => {
      const found = matchmaking.getRoomByPlayerId('nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('getPlayerSymbol', () => {
    test('should return X for first player', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const symbol = matchmaking.getPlayerSymbol(result.room.code, 'p1');
        expect(symbol).toBe('X');
      }
    });

    test('should return O for second player', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const symbol = matchmaking.getPlayerSymbol(result.room.code, 'p2');
        expect(symbol).toBe('O');
      }
    });

    test('should return null for non-existent player', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const symbol = matchmaking.getPlayerSymbol(result.room.code, 'p3');
        expect(symbol).toBeNull();
      }
    });
  });

  describe('updateBoard', () => {
    test('should update board at position', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        const updated = matchmaking.updateBoard(result.room.code, 0, 'X');
        expect(updated).toBe(true);
        expect(result.game.board[0]).toBe('X');
      }
    });

    test('should return false for non-existent room', () => {
      const updated = matchmaking.updateBoard('FAKE', 0, 'X');
      expect(updated).toBe(false);
    });
  });

  describe('switchTurn', () => {
    test('should switch from X to O', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        matchmaking.switchTurn(result.room.code);
        expect(result.game.currentTurn).toBe('O');
      }
    });

    test('should switch from O to X', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        matchmaking.switchTurn(result.room.code);
        matchmaking.switchTurn(result.room.code);
        expect(result.game.currentTurn).toBe('X');
      }
    });
  });

  describe('setGameStatus', () => {
    test('should set status to won with winner', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        matchmaking.setGameStatus(result.room.code, 'won', 'X');
        expect(result.game.state).toBe('won');
        expect(result.game.winner).toBe('X');
      }
    });

    test('should set status to draw without winner', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      if (result.matched) {
        matchmaking.setGameStatus(result.room.code, 'draw');
        expect(result.game.state).toBe('draw');
      }
    });
  });

  describe('getStats', () => {
    test('should return correct stats with no players', () => {
      const stats = matchmaking.getStats();

      expect(stats.waitingPlayers).toBe(0);
      expect(stats.activeRooms).toBe(0);
      expect(stats.totalPlayers).toBe(0);
    });

    test('should return correct stats with one waiting player', () => {
      const player = { id: 'p1', name: 'Alice', socket: {} as any };
      matchmaking.addPlayer(player);

      const stats = matchmaking.getStats();
      expect(stats.waitingPlayers).toBe(1);
      expect(stats.activeRooms).toBe(0);
      expect(stats.totalPlayers).toBe(1);
    });

    test('should return correct stats with one active room', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} as any };
      const player2 = { id: 'p2', name: 'Bob', socket: {} as any };

      matchmaking.addPlayer(player1);
      matchmaking.addPlayer(player2);

      const stats = matchmaking.getStats();
      expect(stats.waitingPlayers).toBe(0);
      expect(stats.activeRooms).toBe(1);
      expect(stats.totalPlayers).toBe(2);
    });
  });
});
