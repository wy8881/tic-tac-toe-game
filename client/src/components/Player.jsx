export default function Player({playerName, symbol, isActive}) {
    return (
        <div className={`player-box ${isActive ? 'active' : undefined}`}>
            <span className="player-name">
                {playerName}
                <span className="player-symbol">{symbol}</span>
            </span>
        </div>
    )
}