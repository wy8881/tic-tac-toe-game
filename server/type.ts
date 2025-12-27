import { Socket } from "socket.io";

export interface Player {
    id: string;
    name: string;
    socket: Socket;
}

export type GameStatus = {state: GameState; winner: Symbol | null};
export type GameState = 'playing' | "won" | "draw";
export type RematchChoice = 'continue' | 'leave';


export type Symbol = 'X' | 'O';

export interface Game {
    playerSymbols: {
        X: string;
        O: string;
    };
    board: (Symbol | null)[];
    currentTurn: Symbol;
    state: GameState;
    winner: Symbol | null;
    createdAt: Date;
}

export interface Room {
    code: string;
    players: Player[];
    game?:Game;
    lastActivity: number;
}

export interface RoomChoice {
    [playerId: string]: RematchChoice;
}
