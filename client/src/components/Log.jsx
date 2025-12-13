export default function Log({turns}) {
    return (
        <ol id={'log'}>
            {turns.map((turn, index) => <li key={`${turn.square.row}${turn.square.col}`}>
                <span className={'player'}>{turn.player} selected {turn.square.row}, {turn.square.col }</span>
                </li>)}
        </ol>
    )
}