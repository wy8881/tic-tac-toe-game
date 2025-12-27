import Player from './components/Player'
import GameBoard from './components/GameBoard'
import {useState} from "react";
import Log from "./components/Log";
import GameOver from "./components/GameOver";
import {socket} from './socket'
import {useEffect} from 'react'
import {Form, Button} from 'react-bootstrap'
import { RotatingLines } from "react-loader-spinner"
import TvShell from './components/TvShell'
import {Toaster, toast} from 'sonner'




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
  const [roomCode, setRoomCode] = useState(null)
  const [winner, setWinner] = useState(null)
  const [waitingMessage, setWaitingMessage] = useState('')
  const [mode, setMode] = useState('quick-match')
  const [rematchMessage, setRematchMessage] = useState('')

  function setupGameListeners() {
    socket.on('waiting-for-match', () => {
      setGameStatus(GAME_STATUS.WAITING)
      console.log('Waiting for a match...')
      setWaitingMessage('Waiting for a match...')
    })
    socket.on('waiting-in-room', () => {
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
      setRoomCode(data.roomCode)
      setBoard(to2DBoard(data.board))
      setCurrentTurn(data.currentTurn)
      setPlayers({
        X: data.players.X,
        O: data.players.O
      })
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
      setGameStatus(GAME_STATUS.FINISHED)
      if (data.winner === 'draw') {
        setWinner('draw')
      } else {
        setWinner(data.winner)
      }
    })
    socket.on('opponent-waiting-rematch', ({message}) => {
      console.log('Opponent waiting for rematch', message)
      setRematchMessage(message)
    })
    socket.on('opponent-left', ({message}) => {
      console.log('Opponent left', message)
      toast.error(message)
      resetGame()
    })
    socket.on('error', (data) => {
      console.log('Error', data)
      toast.error(data.message)
      resetGame()
    })
  }

  function cleanupGameListeners() {
    socket.off('waiting-for-match')
    socket.off('waiting-in-room')
    socket.off('your-symbol')
    socket.off('game-start')
    socket.off('board-update')
    socket.off('game-over')
    socket.off('opponent-waiting-rematch')
    socket.off('opponent-left')
    socket.off('error')
  }

  useEffect(() => {
    if (socket.connected) {
      setupGameListeners()
    }

    socket.on('connect', () => {
      console.log('Socket connected')
      setupGameListeners()
    })
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      toast.error('Failed to connect to server. Please check if the server is running.')
      resetGame()
    })
    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      cleanupGameListeners()
    })

    return () => {
      socket.off('connect')
      socket.off('connect_error')
      socket.off('disconnect')
      cleanupGameListeners()
    }
  }, [])

  function handleQuickMatch(e) {
    e.preventDefault()
    if (playerName.trim().length) {
      socket.connect()
      socket.emit('quick-match', playerName)
    }
    else {
      toast.error('Please enter your name')
      return
    }
  }
  function handleJoinRoom(e) {
    e.preventDefault()
    if (!playerName || !playerName.trim().length) {
      setShowEnteringToast(true)
      setEnteringToastMessage('Please enter your name')
      return
    }
    if (!roomCode || !roomCode.trim().length) {
      setShowEnteringToast(true)
      setEnteringToastMessage('Please enter a room ID')
      return
    }
    socket.connect()
    socket.emit('join-room', {roomCode: roomCode.trim(), playerName: playerName.trim()})
  }
  
  
  function handleSelectSquare(rowIndex, colIndex) {
      if (gameStatus !== GAME_STATUS.PLAYING)
      return;
    if (mySymbol !== currentTurn) 
      return;
    const position = rowIndex * 3 + colIndex;
    if (board[rowIndex][colIndex] !== null) return;
    console.log('Making move', {roomCode, position})
    socket.emit('make-move',{roomCode, position})
  }

  function resetGame() {
    setGameStatus(GAME_STATUS.ENTERING)
    setBoard(INITIAL_GAME_BOARD)
    setGameTurns([])
    setCurrentTurn('X')
    setWinner(null)
    setRoomCode(null)
    setMySymbol(null)
    setRematchMessage('')
    socket.disconnect()
  }

  function handleLeave() {
    socket.emit('leave-room', {roomCode, choice: 'leave'})
    resetGame()
  }

  function handleContinue() {
    socket.emit('rematch-request', {roomCode, choice: 'continue'})
    setGameStatus(GAME_STATUS.WAITING)
    setWaitingMessage('Waiting for your opponent to decide...')
  }

  const hasDraw = winner === 'draw';
  
  let content;
  if (gameStatus === GAME_STATUS.ENTERING) {
    content = (
      <TvShell>
        <h2 className="tv-title">Join Online Game</h2>
        <div className="tv-menu">
          <Form.Group>
            <div className='tv-form-grid'> 
              <Form.Label htmlFor="player-name-input">Your name</Form.Label>
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
              {mode == 'join-room' && (
                <>
                  <Form.Label htmlFor="room-id-input">Room ID</Form.Label>
                  <Form.Control
                    id="room-id-input"
                    type="text"
                    placeholder="Enter room ID"
                    value={roomCode || ''}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="ttt-input"
                  />
                </>
              )}
            </div>
          </Form.Group>
          <div className="buttons-group tv-buttons">
          {mode == 'quick-match' ? (
            <>
              <Button type="submit" onClick={handleQuickMatch} className="ttt-btn-primary">Quick Match</Button>
              <Button
                type="button" 
                className="ttt-btn-primary"
                onClick={() => setMode('join-room')}
                >
                  Join Room
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" onClick={handleJoinRoom} className="ttt-btn-primary">Join Room</Button>
              <Button
                type="button"
                className="ttt-btn-primary"
                onClick={() => setMode('quick-match')}
                >
                  Back                
              </Button>
            </>
          )}
          </div>
        </div>
      </TvShell>
    );
  } else if (gameStatus === GAME_STATUS.WAITING) {
    content = (
      <div className="game-container waiting-wrapper">
          <h2 className="text-center">{waitingMessage}</h2>
          <div className="ttt-spinner-wrap">
            <RotatingLines
              width="44"
              strokeColor="white"
            />
        </div>
      </div>
    );
  } else{
    content = (
      <div className="game-container game-wrapper">
        <div className={`players-container ${gameStatus === GAME_STATUS.PLAYING ? 'highlight-player' : ''}`}>
          <Player playerName={players.X}
              symbol={'X'}
              isActive={currentTurn === 'X'}
              isMe={mySymbol === 'X'}
              />
          <Player playerName={players.O}
                  symbol={'O'}
                  isActive={currentTurn === 'O'}
                  isMe={mySymbol === 'O'}
                  />
        </div>
        <div className="game-board">
          <GameBoard
              onSelectSquare={handleSelectSquare}
              board={board}
          />
        </div>
        <div className="log-container">
          {/* <Log turns={gameTurns}/> */}
        </div>
        {(winner || hasDraw) && gameStatus === GAME_STATUS.FINISHED && <GameOver winner={winner} onContinue={handleContinue} onLeave={handleLeave} message={rematchMessage}/>}
      </div>
    );
  }

  return (
    <div className='app-wrapper'>
      <header>
        {/* <img src="game-logo.png" alt="Tic-Tac-Toe" /> */}
        <h1>Tic-Tac-Toe</h1>
      </header>
      <main className="main-container d-flex justify-content-center align-items-center">
        <Toaster position="top-center" />
        {content}
      </main>
    </div>
  );
}

export default App;
