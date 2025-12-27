import { io } from 'socket.io-client'
const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:3000' : import.meta.env.VITE_SERVER_URL
console.log(SOCKET_URL)
console.log(import.meta.env.VITE_SERVER_URL)
export const socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
})