import {useState} from "react";


export default function GameBoard({ onSelectSquare, board}) {


    return (
        <div className="game-board">
            {board.map((row, rowIndex) => (
                row.map((playerSymbol, colIndex) => (
                    <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => onSelectSquare(rowIndex, colIndex)}
                        disabled={playerSymbol !== null}
                        className="game-board-square"
                    >
                        {playerSymbol}
                    </button>
                ))
            ))}
        </div>
    )
}