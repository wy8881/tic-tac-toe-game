import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { MatchmakingService } from './game/matchmaking.js'
import { setupGameHandlers } from './game/gameController.js'
import logger from './game/logger.js'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

dotenv.config()
console.log(process.env.NODE_ENV)

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}))
app.use(helmet())

const allowedOrigins = process.env.NODE_ENV === 'development' ? ['http://localhost:5173','http://localhost:5174'] : [process.env.CLIENT_URL || 'http://localhost:5173']
console.log(allowedOrigins)

if(process.env.NODE_ENV === 'development' && ! process.env.CLIENT_URL) {
  throw new Error('CLIENT_URL must be set in production')
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

const matchmaking = new MatchmakingService()

setupGameHandlers(io, matchmaking, logger)

setInterval(() => {
  const currentTime = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutes
  const rooms = matchmaking.getRooms();
  
  for (const [roomCode, room] of rooms.entries()) {
    if (currentTime - room.lastActivity > timeout) {
      logger.info({ roomCode, lastActivity: room.lastActivity }, 'Removing inactive room');
      matchmaking.removeRoom(roomCode);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

app.get('/',(req, res) => {
  res.json({
    message:'Tic-Tac-Toe Server',
    status: 'online',
    stats: matchmaking.getStats()
  })
})

app.get('/health',(req, res) => {
  res.status(200).json({
    status:'ok',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
})

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
})
