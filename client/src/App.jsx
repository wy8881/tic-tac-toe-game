import Player from './components/Player'
import GameBoard from './components/GameBoard'
import {useState} from "react";
import Log from "./components/Log";
import GameOver from "./components/GameOver";
import {socket} from './socket'
import {useEffect} from 'react'
import {Form, Button} from 'react-bootstrap'
import { RotatingLines } from "react-loader-spinner"


const INITIAL_PLAYERS = {
    X: 'Player 1',
    O: 'Player 2'
}
const INITIAL_GAME_BOARD = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

function to2DBoard(board1D) {
  return [
    board1D.slice(0, 3),
    board1D.slice(3, 6),
    board1D.slice(6, 9),
  ]
}


function App() {
  const [gameStatus, setGameStatus] = useState('entering');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState(INITIAL_PLAYERS)
  const [gameTurns, setGameTurns] = useState([])
  const [board, setBoard] = useState(INITIAL_GAME_BOARD)
  const [currentTurn, setCurrentTurn] = useState('X')
  const [mySymbol, setMySymbol] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [winner, setWinner] = useState(null)

  useEffect(() => {
    socket.on('waiting-for-match', (data) => {
      setGameStatus('waiting')
      console.log('Waiting for opponent...')
    })
    socket.on('your-symbol', (data) => {
      setMySymbol(data.symbol)
      console.log(`You are playing as ${data.symbol}`)
    })
    socket.on('game-start', (data) => {
      console.log('Game started', data)
      setGameStatus('playing')
      setGameId(data.gameId)
      setBoard(to2DBoard(data.board))
      setCurrentTurn(data.currentTurn)
      setPlayers({
        X: data.players.X,
        O: data.players.O
      })
      console.log('Players', players)
      setGameTurns([])
      setWinner(null)
    })
    socket.on('board-update', (data) => {
      console.log('Board updated', data)
      setBoard(to2DBoard(data.board))
      setCurrentTurn(data.currentTurn)
      if(data.lastMove) {
        setGameTurns(prevTurns => [
          {
            square: {row:Math.floor(data.lastMove.position / 3), col: data.lastMove.position % 3},
            player: data.lastMove.playerSymbol
          },
          ...prevTurns
        ])
      }
    })
    socket.on('game-over', (data) => {
      console.log('Game over', data)
      setBoard(INITIAL_GAME_BOARD)
      setGameStatus('finished')
      if (data.winner === 'draw') {
        setWinner('draw')
      } else {
        setWinner(data.winner)
      }
    })
    socket.on('opponent-left', (data) => {
      console.log('Opponent left', data)
      alert(data.message)
      setGameStatus('entering')
      resetGame()
    })
    socket.on('error', (data) => {
      console.log('Error', data)
      alert(data.message)
    })
    return () => {
      socket.off('waiting')
      socket.off('your-symbol')
      socket.off('game-start')
      socket.off('board-update')
      socket.off('game-over')
      socket.off('opponent-left')
      socket.off('error')
    }
  }, [])

  function handleJoinGame(e) {
    e.preventDefault()
    if (playerName.trim().length) {
      socket.connect()
      socket.emit('join-game', playerName)
    }
  }

  function handleSelectSquare(rowIndex, colIndex) {
    if (gameStatus !== 'playing')
      return;
    if (mySymbol !== currentTurn) 
      return;
    const position = rowIndex * 3 + colIndex;
    if (board[rowIndex][colIndex] !== null) return;
    socket.emit('make-move',{gameId, position})
  }

  function resetGame() {
    setGameStatus('entering')
    setBoard(INITIAL_GAME_BOARD)
    setGameTurns([])
    setCurrentTurn('X')
    setWinner(null)
    setGameId(null)
    setMySymbol(null)
    socket.disconnect()
  }

  function handleReset() {
    resetGame()
  }

  function handlePlayerNameChange(symbol, name) {
    setPlayers((prevPlayers) => {
      return {
        ...prevPlayers,
        [symbol]: name
      }
    })

  }
  const hasDraw = winner === 'draw';
  
  let content;
  if (gameStatus === 'entering') {
    content = (
      <div id="game-container">
        <div id="join-game" className="d-flex flex-column align-items-center gap-5">
          <h2>Join Online Game</h2>
          <Form.Group className="d-flex justify-content-start align-items-center gap-4">
            <Form.Label htmlFor="player-name-input"  id="player-name-label" className="ttt-label">Your name</Form.Label>
            <Form.Control
              id="player-name-input"
              type="text"
              placeholder="Enter your name"
              className="ttt-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              autoFocus
            />
          </Form.Group>
          <Button type="submit" className="ttt-btn-primary" onClick={handleJoinGame}>Join Game</Button>
        </div>
      </div>
    );
  } else if (gameStatus === 'waiting') {
    content = (
      <div id="game-container">
        <div id="waiting" className="d-flex flex-column align-items-center">
          <h2>Waiting for opponent...</h2>
          <div className="ttt-spinner-wrap">
            <RotatingLines
              width="44"
              strokeColor="white"
            />
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <div id="game-container">
        <div className={`players-container ${gameStatus === 'playing' ? 'highlight-player' : ''}`}>
          <Player playerName={players.X}
              symbol={'X'}
              isActive={currentTurn === 'X'}/>
          <Player playerName={players.O}
                  symbol={'O'}
                  isActive={currentTurn === 'O'}/>
        </div>
        {(winner || hasDraw) && <GameOver winner={winner} onRestart={handleReset}/>}
        <GameBoard
            onSelectSquare={handleSelectSquare}
            board={board}
        />
        <div className="log-container">
          <Log turns={gameTurns}/>
        </div>
      </div>
    );
  }

  return (
    <div className='app-wrapper'>
      <header>
        <img src="game-logo.png" alt="Tic-Tac-Toe" />
        <h1>Tic-Tac-Toe</h1>
      </header>
      <main className="main-container">
        {content}
      </main>
    </div>
  );
}

export default App;
