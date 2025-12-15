import Player from './components/Player'
import GameBoard from './components/GameBoard'
import {useState} from "react";
import Log from "./components/Log";
import GameOver from "./components/GameOver";
import {WINNING_COMBINATIONS} from "./winning-combinations";

const INITIAL_PLAYERS = {
    X: 'Player 1',
    O: 'Player 2'
}
const INITIAL_GAME_BOARD = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

function deriveActivePlayer(gameTurns) {
  let curPlayer = 'X';

  if(gameTurns.length > 0 && gameTurns[0].player === 'X') {
    curPlayer = 'O'
  }
  return curPlayer
}

function deriveWinner(gameBoard, players) {
  let winner;

  for (const combination of WINNING_COMBINATIONS) {
    const firstSquare = gameBoard[combination[0].row][combination[0].column];
    const secondSquare = gameBoard[combination[1].row][combination[1].column];
    const thirdSquare = gameBoard[combination[2].row][combination[2].column];

    if(firstSquare &&
        firstSquare === secondSquare &&
        firstSquare === thirdSquare) {
      winner = players[firstSquare];
    }
  }
  return winner;
}

function deriveGameBoard(gameTurns) {
  let gameBoard = [...INITIAL_GAME_BOARD.map(innerArray => [...innerArray])];

  for (const turn of gameTurns) {
    const {square, player} = turn;
    const {row, col} = square;

    gameBoard[row][col] = player;
  }
  return gameBoard;
}

function App() {
  const [players, setPlayers] = useState(INITIAL_PLAYERS)
  const [gameTurns, setGameTurns] = useState([])
  // const [activePlayer, setActivePlayer] = useState('X')

  const curPlayer = deriveActivePlayer(gameTurns)
  const gameBoard = deriveGameBoard(gameTurns);
  const winner = deriveWinner(gameBoard, players);
  const hasDraw = gameTurns.length === 9 && !winner;

  function handleSelectSquare(rowIndex, colIndex) {
    setGameTurns(preTurns => {
      const curPlayer = deriveActivePlayer(preTurns)

      const updateTurns = [
        { square: {row: rowIndex, col: colIndex}, player: curPlayer},
          ...preTurns
      ]
      return updateTurns
    })
  }

  function handleReset() {
    setGameTurns([])
  }

  function handlePlayerNameChange(symbol, name) {
    setPlayers((prevPlayers) => {
      return {
        ...prevPlayers,
        [symbol]: name
      }
    })

  }

  return (
  <main>
    <div id="game-container">
      <ol id={'players'} className={'highlight-player'}>
        <Player initialName={INITIAL_PLAYERS.X}
            symbol={'X'}
            isActive={curPlayer === 'X'}
            onNameChange={handlePlayerNameChange}/>
        <Player initialName={INITIAL_PLAYERS.O}
                symbol={'O'}
                isActive={curPlayer === 'O'}
                onNameChange={handlePlayerNameChange}/>
      </ol>
      {(winner || hasDraw) && <GameOver winner={winner} onRestart={handleReset}/>}
      <GameBoard
          onSelectSquare={handleSelectSquare}
          board={gameBoard}
      />
    </div>
    <Log turns={gameTurns}/>
  </main>
  )}

export default App
