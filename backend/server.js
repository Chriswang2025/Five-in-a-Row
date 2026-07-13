import { WebSocketServer } from 'ws'
import { checkWin, isValidMove, createEmptyBoard } from './game.js'

const PORT = process.env.PORT || 8080

const wss = new WebSocketServer({ port: PORT })

let gameState = {
  status: 'idle',
  playerBlack: null,
  playerWhite: null,
  board: createEmptyBoard(),
  currentTurn: 'black',
  startTime: null
}

let waitingQueue = []

const connections = new Map()

function sendMessage(ws, type, data = {}) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type, data }))
  }
}

function broadcast(type, data) {
  if (gameState.playerBlack) {
    sendMessage(gameState.playerBlack.socket, type, data)
  }
  if (gameState.playerWhite) {
    sendMessage(gameState.playerWhite.socket, type, data)
  }
}

function resetGame() {
  gameState = {
    status: 'idle',
    playerBlack: null,
    playerWhite: null,
    board: createEmptyBoard(),
    currentTurn: 'black',
    startTime: null
  }
}

function startNewGame() {
  if (waitingQueue.length >= 2 && gameState.status === 'idle') {
    const player1 = waitingQueue.shift()
    const player2 = waitingQueue.shift()
    
    gameState.status = 'playing'
    gameState.playerBlack = player1
    gameState.playerWhite = player2
    gameState.board = createEmptyBoard()
    gameState.currentTurn = 'black'
    gameState.startTime = Date.now()
    
    sendMessage(player1.socket, 'game_start', {
      color: 'black',
      currentTurn: 'black'
    })
    
    sendMessage(player2.socket, 'game_start', {
      color: 'white',
      currentTurn: 'black'
    })
    
    console.log(`游戏开始: ${player1.userId} (黑) vs ${player2.userId} (白)`)
  }
}

function handleJoinGame(ws, userId) {
  console.log(`用户加入: ${userId}`)
  
  connections.set(userId, { socket: ws, userId, joinTime: Date.now() })
  
  if (gameState.status === 'idle' && waitingQueue.length === 0) {
    waitingQueue.push({ userId, socket: ws })
    sendMessage(ws, 'waiting', { queuePosition: 0 })
    console.log(`用户 ${userId} 进入等待队列`)
  } else if (gameState.status === 'idle' && waitingQueue.length === 1) {
    waitingQueue.push({ userId, socket: ws })
    startNewGame()
  } else if (gameState.status === 'playing') {
    waitingQueue.push({ userId, socket: ws })
    sendMessage(ws, 'game_busy', {
      message: '游戏进行中，请等待...',
      queuePosition: waitingQueue.length
    })
    console.log(`用户 ${userId} 排队中，当前排队: ${waitingQueue.length}人`)
  }
}

function handlePlaceStone(ws, userId, data) {
  if (gameState.status !== 'playing') {
    sendMessage(ws, 'error', { message: '游戏未开始' })
    return
  }
  
  const isBlackTurn = gameState.currentTurn === 'black'
  const currentPlayer = isBlackTurn ? gameState.playerBlack : gameState.playerWhite
  
  if (currentPlayer.userId !== userId) {
    sendMessage(ws, 'error', { message: '不是你的回合' })
    return
  }
  
  const { x, y } = data
  
  if (!isValidMove(gameState.board, x, y)) {
    sendMessage(ws, 'error', { message: '非法落子位置' })
    return
  }
  
  const colorValue = isBlackTurn ? 1 : 2
  gameState.board[x][y] = colorValue
  
  const winner = checkWin(gameState.board, x, y, gameState.currentTurn)
  
  broadcast('board_update', {
    x,
    y,
    color: gameState.currentTurn,
    currentTurn: winner ? gameState.currentTurn : (isBlackTurn ? 'white' : 'black')
  })
  
  if (winner) {
    broadcast('game_over', {
      winner: gameState.currentTurn,
      reason: 'five_in_row'
    })
    
    console.log(`游戏结束: ${gameState.currentTurn} 获胜`)
    resetGame()
    startNewGame()
  } else {
    gameState.currentTurn = isBlackTurn ? 'white' : 'black'
  }
}

function handleResign(ws, userId) {
  if (gameState.status !== 'playing') {
    return
  }
  
  const isBlack = gameState.playerBlack && gameState.playerBlack.userId === userId
  const winner = isBlack ? 'white' : 'black'
  
  broadcast('game_over', {
    winner,
    reason: 'resign'
  })
  
  console.log(`${userId} 认输, ${winner} 获胜`)
  resetGame()
  startNewGame()
}

function handleDisconnect(userId) {
  console.log(`用户断线: ${userId}`)
  
  connections.delete(userId)
  
  waitingQueue = waitingQueue.filter(player => player.userId !== userId)
  
  if (gameState.status === 'playing') {
    const isBlack = gameState.playerBlack && gameState.playerBlack.userId === userId
    const isWhite = gameState.playerWhite && gameState.playerWhite.userId === userId
    
    if (isBlack || isWhite) {
      const opponent = isBlack ? gameState.playerWhite : gameState.playerBlack
      const disconnectedPlayer = isBlack ? gameState.playerBlack : gameState.playerWhite
      
      if (disconnectedPlayer) {
        disconnectedPlayer.disconnectTimer = setTimeout(() => {
          if (opponent) {
            sendMessage(opponent.socket, 'game_over', {
              winner: opponent === gameState.playerBlack ? 'black' : 'white',
              reason: 'opponent_disconnect'
            })
          }
          
          console.log(`${userId} 超时未重连，游戏结束`)
          resetGame()
          startNewGame()
        }, 30000)
        
        if (opponent) {
          sendMessage(opponent.socket, 'opponent_disconnect', {
            remainingTime: 30
          })
        }
      }
    }
  }
}

function handleReconnect(ws, userId) {
  console.log(`用户重连: ${userId}`)
  
  connections.set(userId, { socket: ws, userId })
  
  if (gameState.status === 'playing') {
    const isBlack = gameState.playerBlack && gameState.playerBlack.userId === userId
    const isWhite = gameState.playerWhite && gameState.playerWhite.userId === userId
    
    if (isBlack) {
      if (gameState.playerBlack.disconnectTimer) {
        clearTimeout(gameState.playerBlack.disconnectTimer)
        gameState.playerBlack.disconnectTimer = null
      }
      gameState.playerBlack.socket = ws
      
      sendMessage(ws, 'game_resume', {
        board: gameState.board,
        color: 'black',
        currentTurn: gameState.currentTurn
      })
      
      if (gameState.playerWhite) {
        sendMessage(gameState.playerWhite.socket, 'game_resume', {
          board: gameState.board,
          color: 'white',
          currentTurn: gameState.currentTurn
        })
      }
      
      console.log(`黑方 ${userId} 重连成功`)
    } else if (isWhite) {
      if (gameState.playerWhite.disconnectTimer) {
        clearTimeout(gameState.playerWhite.disconnectTimer)
        gameState.playerWhite.disconnectTimer = null
      }
      gameState.playerWhite.socket = ws
      
      sendMessage(ws, 'game_resume', {
        board: gameState.board,
        color: 'white',
        currentTurn: gameState.currentTurn
      })
      
      if (gameState.playerBlack) {
        sendMessage(gameState.playerBlack.socket, 'game_resume', {
          board: gameState.board,
          color: 'black',
          currentTurn: gameState.currentTurn
        })
      }
      
      console.log(`白方 ${userId} 重连成功`)
    }
  }
}

wss.on('connection', (ws) => {
  console.log('新连接建立')
  
  let currentUserId = null
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      const { type, data: payload } = message
      const userId = payload?.userId
      
      if (!currentUserId) {
        currentUserId = userId
      }
      
      console.log(`收到消息: ${type} from ${userId}`)
      
      switch (type) {
        case 'join_game':
          handleJoinGame(ws, userId)
          break
        case 'place_stone':
          handlePlaceStone(ws, userId, payload)
          break
        case 'resign':
          handleResign(ws, userId)
          break
        case 'reconnect':
          handleReconnect(ws, userId)
          break
        case 'cancel_match':
          waitingQueue = waitingQueue.filter(p => p.userId !== userId)
          break
        default:
          console.log(`未知消息类型: ${type}`)
      }
    } catch (error) {
      console.error('处理消息失败:', error)
    }
  })
  
  ws.on('close', () => {
    if (currentUserId) {
      handleDisconnect(currentUserId)
    }
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error)
  })
})

console.log(`五子棋WebSocket服务器运行在端口 ${PORT}`)
console.log(`等待客户端连接...`)
