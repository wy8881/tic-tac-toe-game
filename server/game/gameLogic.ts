import { Symbol, GameStatus } from '../type.js'

const WINNING_LINES: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]

function checkWin(board: (Symbol | null)[]): Symbol | null {
    for (const combination of WINNING_LINES) {
        const [a, b, c] = combination
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] as Symbol
        }
    }
    return null
}

function checkDraw(board: (Symbol | null)[]): boolean {
    return board.every(cell => cell !== null)
}

function isValidMove(board: (Symbol | null)[], position: number): boolean {
    if (position < 0 || position > 8) {
        return false
    }
    if (board[position] !== null) {
        return false
    }
    return true
}

function createBoard(): (Symbol | null)[] {
    return Array(9).fill(null)
}

function getGameStatus(board: (Symbol | null)[]): GameStatus {
    const winnerSymbol = checkWin(board)
    if (winnerSymbol) {
        return { state: 'won', winner: winnerSymbol }
    }
    if (checkDraw(board)) {
        return { state: 'draw', winner: null }
    }
    return { state: 'playing', winner: null }
}

export {
    checkWin,
    checkDraw,
    isValidMove,
    createBoard,
    getGameStatus,
    WINNING_LINES
}
