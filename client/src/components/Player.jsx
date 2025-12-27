export default function Player({playerName, symbol, isActive, isMe}) {
    return (
        <div className={`player-box ${isActive ? 'active' : undefined}`}>
            <span className="player-name">
                {isMe ? <span>👤</span> : null}
                {playerName}
                <span className="player-symbol">{symbol}</span>
            </span>
        </div>
    )
}