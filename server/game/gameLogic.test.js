const {
    checkWin,
    checkDraw,
    isValidMove,
    createBoard,
    getGameStatus,
    WINNING_LINES
  } = require('./gameLogic');
  
  describe('checkWin', () => {
    
    describe('horizontal wins', () => {
      test('should detect X win in first row', () => {
        const board = [
          'X', 'X', 'X',
          null, 'O', null,
          null, 'O', null
        ];
        expect(checkWin(board)).toBe('X');
      });
  
      test('should detect O win in second row', () => {
        const board = [
          'X', null, 'X',
          'O', 'O', 'O',
          null, 'X', null
        ];
        expect(checkWin(board)).toBe('O');
      });
  
      test('should detect X win in third row', () => {
        const board = [
          'O', 'O', null,
          null, 'O', 'X',
          'X', 'X', 'X'
        ];
        expect(checkWin(board)).toBe('X');
      });
    });
  
    describe('vertical wins', () => {
      test('should detect X win in first column', () => {
        const board = [
          'X', 'O', 'O',
          'X', null, null,
          'X', null, null
        ];
        expect(checkWin(board)).toBe('X');
      });
  
      test('should detect O win in second column', () => {
        const board = [
          'X', 'O', 'X',
          null, 'O', null,
          null, 'O', 'X'
        ];
        expect(checkWin(board)).toBe('O');
      });
  
      test('should detect X win in third column', () => {
        const board = [
          'O', 'O', 'X',
          null, null, 'X',
          null, 'O', 'X'
        ];
        expect(checkWin(board)).toBe('X');
      });
    });
  
    describe('diagonal wins', () => {
      test('should detect X win from top-left to bottom-right', () => {
        const board = [
          'X', 'O', 'O',
          null, 'X', null,
          'O', null, 'X'
        ];
        expect(checkWin(board)).toBe('X');
      });
  
      test('should detect O win from top-right to bottom-left', () => {
        const board = [
          'X', 'X', 'O',
          null, 'O', null,
          'O', null, 'X'
        ];
        expect(checkWin(board)).toBe('O');
      });
    });
  
    describe('no winner scenarios', () => {
      test('should return null when game is in progress', () => {
        const board = [
          'X', 'O', null,
          null, 'X', null,
          null, null, null
        ];
        expect(checkWin(board)).toBeNull();
      });
  
      test('should return null for empty board', () => {
        const board = Array(9).fill(null);
        expect(checkWin(board)).toBeNull();
      });
  
      test('should return null for draw (no winner)', () => {
        const board = [
          'X', 'O', 'X',
          'X', 'O', 'O',
          'O', 'X', 'X'
        ];
        expect(checkWin(board)).toBeNull();
      });
    });
  });
  
  describe('checkDraw', () => {
    
    test('should return true when board is full', () => {
      const board = [
        'X', 'O', 'X',
        'X', 'O', 'O',
        'O', 'X', 'X'
      ];
      expect(checkDraw(board)).toBe(true);
    });
  
    test('should return false when board has empty cells', () => {
      const board = [
        'X', 'O', 'X',
        null, 'O', null,
        'O', 'X', 'X'
      ];
      expect(checkDraw(board)).toBe(false);
    });
  
    test('should return false for empty board', () => {
      const board = Array(9).fill(null);
      expect(checkDraw(board)).toBe(false);
    });
  
    test('should return false when only one cell is filled', () => {
      const board = [
        'X', null, null,
        null, null, null,
        null, null, null
      ];
      expect(checkDraw(board)).toBe(false);
    });
  });
  
  describe('isValidMove', () => {
    
    test('should return true for empty cell', () => {
      const board = [
        'X', null, 'O',
        null, 'X', null,
        null, 'O', null
      ];
      expect(isValidMove(board, 1)).toBe(true);
      expect(isValidMove(board, 3)).toBe(true);
      expect(isValidMove(board, 8)).toBe(true);
    });
  
    test('should return false for occupied cell', () => {
      const board = [
        'X', null, 'O',
        null, 'X', null,
        null, 'O', null
      ];
      expect(isValidMove(board, 0)).toBe(false);
      expect(isValidMove(board, 2)).toBe(false);
      expect(isValidMove(board, 4)).toBe(false);
    });
  
    test('should return false for position below 0', () => {
      const board = Array(9).fill(null);
      expect(isValidMove(board, -1)).toBe(false);
      expect(isValidMove(board, -5)).toBe(false);
    });
  
    test('should return false for position above 8', () => {
      const board = Array(9).fill(null);
      expect(isValidMove(board, 9)).toBe(false);
      expect(isValidMove(board, 10)).toBe(false);
      expect(isValidMove(board, 100)).toBe(false);
    });
  
    test('should return true for all positions on empty board', () => {
      const board = Array(9).fill(null);
      for (let i = 0; i < 9; i++) {
        expect(isValidMove(board, i)).toBe(true);
      }
    });
  });
  
  describe('createBoard', () => {
    
    test('should create array of length 9', () => {
      const board = createBoard();
      expect(board).toHaveLength(9);
    });
  
    test('should create array filled with null', () => {
      const board = createBoard();
      expect(board.every(cell => cell === null)).toBe(true);
    });
  
    test('should create new instance each time', () => {
      const board1 = createBoard();
      const board2 = createBoard();
      expect(board1).not.toBe(board2);
    });
  });
  
  describe('getGameStatus', () => {
    
    test('should return won status when X wins', () => {
      const board = [
        'X', 'X', 'X',
        null, 'O', null,
        null, 'O', null
      ];
      const status = getGameStatus(board);
      expect(status.status).toBe('won');
      expect(status.winnerSymbol).toBe('X');
    });
  
    test('should return won status when O wins', () => {
      const board = [
        'X', 'X', 'O',
        null, 'O', null,
        'O', null, 'X'
      ];
      const status = getGameStatus(board);
      expect(status.status).toBe('won');
      expect(status.winnerSymbol).toBe('O');
    });
  
    test('should return draw status when board is full with no winner', () => {
      const board = [
        'X', 'O', 'X',
        'X', 'O', 'O',
        'O', 'X', 'X'
      ];
      const status = getGameStatus(board);
      expect(status.status).toBe('draw');
      expect(status.winnerSymbol).toBeNull();
    });
  
    test('should return playing status when game is in progress', () => {
      const board = [
        'X', 'O', null,
        null, 'X', null,
        null, null, null
      ];
      const status = getGameStatus(board);
      expect(status.status).toBe('playing');
      expect(status.winnerSymbol).toBeNull();
    });
  
    test('should return playing status for empty board', () => {
      const board = Array(9).fill(null);
      const status = getGameStatus(board);
      expect(status.status).toBe('playing');
      expect(status.winnerSymbol).toBeNull();
    });
  });
  
  describe('WINNING_LINES constant', () => {
    
    test('should have 8 winning combinations', () => {
      expect(WINNING_LINES).toHaveLength(8);
    });
  
    test('each line should have 3 positions', () => {
      WINNING_LINES.forEach(line => {
        expect(line).toHaveLength(3);
      });
    });
  
    test('should include all horizontal lines', () => {
      expect(WINNING_LINES).toContainEqual([0, 1, 2]);
      expect(WINNING_LINES).toContainEqual([3, 4, 5]);
      expect(WINNING_LINES).toContainEqual([6, 7, 8]);
    });
  
    test('should include all vertical lines', () => {
      expect(WINNING_LINES).toContainEqual([0, 3, 6]);
      expect(WINNING_LINES).toContainEqual([1, 4, 7]);
      expect(WINNING_LINES).toContainEqual([2, 5, 8]);
    });
  
    test('should include both diagonal lines', () => {
      expect(WINNING_LINES).toContainEqual([0, 4, 8]);
      expect(WINNING_LINES).toContainEqual([2, 4, 6]);
    });
  });