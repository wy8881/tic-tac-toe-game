import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { MatchmakingService } from './game/matchmaking.js'
import { setupGameHandlers } from './game/gameController.js'
import logger from './game/logger.js'

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

const allowedOrigins: string[] = [
  "http://localhost:5173",
  "http://localhost:5174",
]

if(process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL)
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})

const matchmaking = new MatchmakingService()

setupGameHandlers(io, matchmaking, logger)

app.get('/',(req, res) => {
  res.json({
    message:'Tic-Tac-Toe Server',
    status: 'online',
    stats: matchmaking.getStats()
  })
})

app.get('/health',(req, res) => {
  res.json({status:'healthy'})
})

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
})
