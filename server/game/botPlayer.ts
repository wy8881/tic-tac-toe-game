import { Symbol } from '../type.js';
import { WINNING_LINES, checkWin, checkDraw } from './gameLogic.js';

export type BotDifficulty = 'easy' | 'medium' | 'hard';


class BotPlayer {
    private difficulty: BotDifficulty;

    constructor(difficulty: BotDifficulty) {
        this.difficulty = difficulty;   
    }

    calculateMove(board: (Symbol | null)[], symbol: Symbol): number {
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove(board, symbol);
            case 'medium':
                return this.getStrategicMove(board, symbol);
            case 'hard':
                return this.getMinimaxMove(board, symbol);
        }
    }

    private findEmptySquares(board: (Symbol | null)[]): number[] {
        return board.reduce((acc: number[], square: Symbol | null, index: number) => {
            if (square === null) {
                acc.push(index);
            }
            return acc;
        }, []);
    }

    private getRandomMove(board: (Symbol | null)[], symbol: Symbol): number {
        const emptySquares = this.findEmptySquares(board);
        const randomIndex = Math.floor(Math.random() * emptySquares.length);
        return emptySquares[randomIndex];
    } 

    private getStrategicMove(board: (Symbol | null)[], symbol: Symbol): number {
        const opponentSymbol = symbol === 'X' ? 'O' : 'X';
        const winMove = this.findWinMove(board, symbol);
        if (winMove) {
            return winMove;
        }
        const blockMove = this.findWinMove(board, opponentSymbol);
        if (blockMove) {
            return blockMove;
        }
        
        if (board[4] === null) return 4;
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter(corner => board[corner] === null);
        if (emptyCorners.length > 0) {
            return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        }
       
        const edges = [1, 3, 5, 7];
        const emptyEdges = edges.filter(edge => board[edge] === null);
        if (emptyEdges.length > 0) {
            return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
        }
        throw new Error('No valid move found');
    }

    private findWinMove(board: (Symbol | null)[], symbol: Symbol): number | null {
        for (const [a, b, c] of WINNING_LINES) {
            const values = [board[a], board[b], board[c]];
            const symbolCount = values.filter(value => value === symbol).length;
            const nullCount = values.filter(value => value === null).length;
            if (symbolCount === 2 && nullCount === 1) {
                if (board[a] === null) return a;
                if (board[b] === null) return b;
                if (board[c] === null) return c;
            }
        }
        return null;
    }

  private getMinimaxMove(board: (Symbol | null)[], symbol: Symbol): number{
    let bestScore = -Infinity;
    let bestMove = -1;
    const opponentSymbol = symbol === 'X' ? 'O' : 'X';
    const emptySquares = this.findEmptySquares(board);
    
    for (const i of emptySquares) {
        board[i] = symbol;
        const score = this.minMax(board, symbol, opponentSymbol, 0, false);
        board[i] = null;
        if (score > bestScore) {
            bestScore = score;
            bestMove = i;
        }
    }
    return bestMove;
    }

private minMax(board: (Symbol | null)[], botSymbol: Symbol,opponentSymbol: Symbol, depth: number, isMaximizing: boolean): number {
    const winner = checkWin(board);
    if (winner === botSymbol) return 10 - depth;
    if (winner === opponentSymbol) return depth - 10;
    const draw = checkDraw(board);
    if (draw) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        const emptySquares = this.findEmptySquares(board);
        for (const i of emptySquares) {
            board[i] = botSymbol;
            const score = this.minMax(board, botSymbol, opponentSymbol, depth + 1, false);
            board[i] = null;
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        const emptySquares = this.findEmptySquares(board);
        for (const i of emptySquares) {
            board[i] = opponentSymbol;
            const score = this.minMax(board, botSymbol, opponentSymbol, depth + 1, true);
            board[i] = null;
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}
}
export default BotPlayer;