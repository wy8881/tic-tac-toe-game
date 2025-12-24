import { Button } from 'react-bootstrap'
export default function GameOver({winner, onContinue, onLeave, message=''}) {
    return <div id={'game-over'}>
        <h2>Game Over</h2>
        {winner && <p>{winner} won</p>}
        {!winner && <p>It's a draw</p>}
        {message && <p>{message}</p>}
        <div className="buttons-group game-over-buttons">
            <Button type="submit" className="ttt-btn-primary game-over-button" onClick={onContinue}>Continue</Button>
            <Button type="submit" className="ttt-btn-primary game-over-button" onClick={onLeave}>Leave</Button>
        </div>
    </div>
}