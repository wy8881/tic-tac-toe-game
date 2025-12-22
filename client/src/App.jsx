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

const GAME_STATUS = {
  ENTERING: 'entering',
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
}

function to2DBoard(board1D) {
  return [
    board1D.slice(0, 3),
    board1D.slice(3, 6),
    board1D.slice(6, 9),
  ]
}


function App() {
  const [gameStatus, setGameStatus] = useState(GAME_STATUS.ENTERING);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState(INITIAL_PLAYERS)
  const [gameTurns, setGameTurns] = useState([])
  const [board, setBoard] = useState(INITIAL_GAME_BOARD)
  const [currentTurn, setCurrentTurn] = useState('X')
  const [mySymbol, setMySymbol] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [winner, setWinner] = useState(null)
  const [waitingMessage, setWaitingMessage] = useState('')

  useEffect(() => {
    socket.on('waiting-for-match', (data) => {
      setGameStatus(GAME_STATUS.WAITING)
      console.log('Waiting for a match...')
      setWaitingMessage('Waiting for a match...')
    })
    socket.on('waiting-in-room', (data) => {
      setGameStatus(GAME_STATUS.WAITING)
      console.log('Waiting for your friend to join...')
      setWaitingMessage('Waiting for your friend to join...')
    })
    socket.on('your-symbol', (data) => {
      setMySymbol(data.symbol)
      console.log(`You are playing as ${data.symbol}`)
    })
    socket.on('game-start', (data) => {
      console.log('Game started', data)
      setGameStatus(GAME_STATUS.PLAYING)
      setRoomId(data.roomId)
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
      setGameStatus(GAME_STATUS.FINISHED)
      if (data.winner === 'draw') {
        setWinner('draw')
      } else {
        setWinner(data.winner)
      }
    })

    socket.on('waiting-for-oppenent-decision', (data) => {
      console.log('Waiting for your opponent to decide...')
      setGameStatus(GAME_STATUS.WAITING)
      setWaitingMessage('Waiting for your opponent to decide...')
    })

    socket.on('opponent-left', (data) => {
      console.log('Opponent left', data)
      alert(data.message)
      setGameStatus(GAME_STATUS.ENTERING)
      resetGame()
    })
    socket.on('error', (data) => {
      console.log('Error', data)
      alert(data.message)
    })
    return () => {
      socket.off('waiting-for-match')
      socket.off('waiting-in-room')
      socket.off('your-symbol')
      socket.off('game-start')
      socket.off('board-update')
      socket.off('game-over')
      socket.off('opponent-left')
      socket.off('waiting-for-oppenent-decision')
      socket.off('error')
    }
  }, [])

  function handleQuickMatch(e) {
    e.preventDefault()
    if (playerName.trim().length) {
      socket.connect()
      socket.emit('quick-match', playerName)
    }
  }
  function handleJoinRoom(e) {
    e.preventDefault()
    if (roomId.trim().length) {
      socket.connect()
      socket.emit('join-room', {roomCode: roomId, playerName: playerName})
    }
  }
  
  
  function handleSelectSquare(rowIndex, colIndex) {
      if (gameStatus !== GAME_STATUS.PLAYING)
      return;
    if (mySymbol !== currentTurn) 
      return;
    const position = rowIndex * 3 + colIndex;
    if (board[rowIndex][colIndex] !== null) return;
    socket.emit('make-move',{roomId, position})
  }

  function resetGame() {
    setGameStatus(GAME_STATUS.ENTERING)
    setBoard(INITIAL_GAME_BOARD)
    setGameTurns([])
    setCurrentTurn('X')
    setWinner(null)
    setRoomId(null)
    setMySymbol(null)
    socket.disconnect()
  }

  function handleReset() {
    resetGame()
  }
  const hasDraw = winner === 'draw';
  
  let content;
  if (gameStatus === GAME_STATUS.ENTERING) {
    content = (
      <div id="game-container">
        <div id="join-game" className="d-flex flex-column align-items-center gap-3 ttt-form ttt-panel">
          <h2>Join Online Game</h2>
          <Form.Group className="d-flex justify-content-start align-items-center gap-4 ttt-row">
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

          <form onSubmit={handleQuickMatch} className='ttt-actions'>
            <Button type="submit" className="ttt-btn-primary">Quick Match</Button>
          </form>

          <div className="ttt-divider">
            <span>OR</span>
          </div>

          <form onSubmit={handleJoinRoom} className="ttt-room-form">
            <Form.Group className="d-flex justify-content-start align-items-center gap-4 ttt-row">
              <Form.Label htmlFor="room-id-input"  id="room-id-label" className="ttt-label">Room ID</Form.Label>
              <Form.Control
                id="room-id-input"
                type="text"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="ttt-input"
              />
            </Form.Group>
            <Button type="submit" className="ttt-btn-primary">Join Room</Button>
          </form>
        </div>
      </div>
    );
  } else if (gameStatus === GAME_STATUS.WAITING) {
    content = (
      <div id="game-container">
        <div id="waiting" className="d-flex flex-column align-items-center">
          <h2>{waitingMessage}</h2>
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
        <div className={`players-container ${gameStatus === GAME_STATUS.PLAYING ? 'highlight-player' : ''}`}>
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
