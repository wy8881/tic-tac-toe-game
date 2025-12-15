const {MatchmakingQueue} = require('./matchmaking');

describe('MatchmakingQueue', () => {
  let matchmaking;

  beforeEach(() => {
    matchmaking = new MatchmakingQueue();
  });

  describe('addPlayer', () => {
    test('should add first player to waiting queue', () => {
      const player = { id: 'p1', name: 'Alice', socket: {} };
      const result = matchmaking.addPlayer(player);

      expect(result.matched).toBe(false);
      expect(result.position).toBe(1);
      expect(matchmaking.waitingPlayers).toHaveLength(1);
    });

    test('should match two players immediately', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      expect(result.matched).toBe(true);
      expect(result.game).toBeDefined();
      expect(result.game.players.X.name).toBe('Alice');
      expect(result.game.players.O.name).toBe('Bob');
      expect(matchmaking.waitingPlayers).toHaveLength(0);
    });

    test('should assign X to first player and O to second', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      expect(result.game.players.X.id).toBe('p1');
      expect(result.game.players.O.id).toBe('p2');
      expect(result.game.currentTurn).toBe('X');
    });
  });

  describe('createGame', () => {
    test('should create game with empty board', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      const game = matchmaking.createGame(player1, player2);

      expect(game.board).toEqual(Array(9).fill(null));
      expect(game.currentTurn).toBe('X');
      expect(game.status).toBe('playing');
    });

    test('should store game in games map', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      const game = matchmaking.createGame(player1, player2);

      expect(matchmaking.games.has(game.id)).toBe(true);
      expect(matchmaking.games.get(game.id)).toBe(game);
    });
  });

  describe('generateGameId', () => {
    test('should generate unique IDs', () => {
      const id1 = matchmaking.generateGameId();
      const id2 = matchmaking.generateGameId();

      expect(id1).not.toBe(id2);
      expect(id1).toContain('game_');
      expect(id2).toContain('game_');
    });
  });

  describe('getGame', () => {
    test('should return game by ID', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      const game = matchmaking.createGame(player1, player2);
      const retrieved = matchmaking.getGame(game.id);

      expect(retrieved).toBe(game);
    });

    test('should return undefined for non-existent game', () => {
      const retrieved = matchmaking.getGame('fake_id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('removeGame', () => {
    test('should remove game from map', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      const game = matchmaking.createGame(player1, player2);
      matchmaking.removeGame(game.id);

      expect(matchmaking.games.has(game.id)).toBe(false);
    });
  });

  describe('removeWaitingPlayer', () => {
    test('should remove player from waiting queue', () => {
      const player = { id: 'p1', name: 'Alice', socket: {} };

      matchmaking.addPlayer(player);
      const removed = matchmaking.removeWaitingPlayer('p1');

      expect(removed).toBe(true);
      expect(matchmaking.waitingPlayers).toHaveLength(0);
    });

    test('should return false if player not found', () => {
      const removed = matchmaking.removeWaitingPlayer('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('findGameByPlayerId', () => {
    test('should find game for player X', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      const found = matchmaking.findGameByPlayerId('p1');
      expect(found).toBe(result.game);
    });

    test('should find game for player O', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      const found = matchmaking.findGameByPlayerId('p2');
      expect(found).toBe(result.game);
    });

    test('should return null if player not in any game', () => {
      const found = matchmaking.findGameByPlayerId('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('getPlayerSymbol', () => {
    test('should return X for first player', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      const symbol = matchmaking.getPlayerSymbol(result.game.id, 'p1');
      expect(symbol).toBe('X');
    });

    test('should return O for second player', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      const symbol = matchmaking.getPlayerSymbol(result.game.id, 'p2');
      expect(symbol).toBe('O');
    });

    test('should return null for non-existent player', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      const symbol = matchmaking.getPlayerSymbol(result.game.id, 'p3');
      expect(symbol).toBeNull();
    });
  });

  describe('updateBoard', () => {
    test('should update board at position', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      const updated = matchmaking.updateBoard(result.game.id, 0, 'X');
      expect(updated).toBe(true);
      expect(result.game.board[0]).toBe('X');
    });

    test('should return false for non-existent game', () => {
      const updated = matchmaking.updateBoard('fake_id', 0, 'X');
      expect(updated).toBe(false);
    });
  });

  describe('switchTurn', () => {
    test('should switch from X to O', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      matchmaking.switchTurn(result.game.id);
      expect(result.game.currentTurn).toBe('O');
    });

    test('should switch from O to X', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      matchmaking.switchTurn(result.game.id);
      matchmaking.switchTurn(result.game.id);
      expect(result.game.currentTurn).toBe('X');
    });
  });

  describe('setGameStatus', () => {
    test('should set status to won with winner', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      matchmaking.setGameStatus(result.game.id, 'won', 'X');
      expect(result.game.status).toBe('won');
      expect(result.game.winner).toBe('X');
    });

    test('should set status to draw without winner', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      const result = matchmaking.addPlayer(player2);

      matchmaking.setGameStatus(result.game.id, 'draw');
      expect(result.game.status).toBe('draw');
    });
  });

  describe('getStats', () => {
    test('should return correct stats with no players', () => {
      const stats = matchmaking.getStats();

      expect(stats.waitingPlayers).toBe(0);
      expect(stats.activeGames).toBe(0);
      expect(stats.totalPlayers).toBe(0);
    });

    test('should return correct stats with one waiting player', () => {
      const player = { id: 'p1', name: 'Alice', socket: {} };
      matchmaking.addPlayer(player);

      const stats = matchmaking.getStats();
      expect(stats.waitingPlayers).toBe(1);
      expect(stats.activeGames).toBe(0);
      expect(stats.totalPlayers).toBe(1);
    });

    test('should return correct stats with one active game', () => {
      const player1 = { id: 'p1', name: 'Alice', socket: {} };
      const player2 = { id: 'p2', name: 'Bob', socket: {} };

      matchmaking.addPlayer(player1);
      matchmaking.addPlayer(player2);

      const stats = matchmaking.getStats();
      expect(stats.waitingPlayers).toBe(0);
      expect(stats.activeGames).toBe(1);
      expect(stats.totalPlayers).toBe(2);
    });
  });
});