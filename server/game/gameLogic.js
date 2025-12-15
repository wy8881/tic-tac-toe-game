const WINNING_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]

/**
 * @param {Array} board
 * @returns {string | null}
 */
function checkWin(board) {
    for (const combination of WINNING_LINES) {
        const [a, b, c] = combination
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]
        }
    }
    return null
}

/**
 * Checks if the board is full
 * @param {Array} board
 * @returns {boolean}
 */
function checkDraw(board) {
    return board.every(cell => cell !== null)
}

/**
 *  Check if this is a valid move
 *  @param {Array} board
 *  @param {number} position
 *  @returns {boolean}
 */
function isValidMove(board, position) {
    if (position < 0 || position > 8) {
        return false
    }
    if (board[position] !== null) {
        return false
    }
    return true
}

/**
 * Create a new board
 * @returns {Array}
 */
function createBoard() {
    return Array(9).fill(null)
}

/**
 * Get board state
 * @param {Array} board
 * @returns{Object} - {status: 'playing' | 'won' | 'draw', winner: string | null}
 */
function getGameStatus(board) {
    const winnerSymbol = checkWin(board)
    if (winnerSymbol) {
        return { status: 'won', winnerSymbol: winnerSymbol }
    }
    if (checkDraw(board)) {
        return { status: 'draw', winnerSymbol: null }
    }
    return { status: 'playing', winnerSymbol: null }
}

module.exports = {
    checkWin,
    checkDraw,
    isValidMove,
    createBoard,
    getGameStatus,
    WINNING_LINES
}