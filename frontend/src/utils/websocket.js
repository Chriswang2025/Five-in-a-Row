class WebSocketClient {
  constructor() {
    this.ws = null
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.messageHandlers = {}
    this.isConnecting = false
    this.userId = this.getUserId()
  }

  getUserId() {
    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', userId)
    }
    return userId
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve()
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket连接成功')
          this.isConnecting = false
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log('收到消息:', message)
            
            if (this.messageHandlers[message.type]) {
              this.messageHandlers[message.type](message.data)
            }
          } catch (error) {
            console.error('解析消息失败:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket连接关闭')
          this.isConnecting = false
          this.ws = null
          this.handleReconnect()
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect().catch(err => {
          console.error('重连失败:', err)
        })
      }, this.reconnectDelay)
    } else {
      console.error('重连次数已达上限')
      if (this.messageHandlers['connection_failed']) {
        this.messageHandlers['connection_failed']()
      }
    }
  }

  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, data: { ...data, userId: this.userId } }
      console.log('发送消息:', message)
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket未连接')
    }
  }

  on(type, handler) {
    this.messageHandlers[type] = handler
  }

  off(type) {
    delete this.messageHandlers[type]
  }

  disconnect() {
    if (this.ws) {
      this.reconnectAttempts = this.maxReconnectAttempts
      this.ws.close()
      this.ws = null
    }
  }
}

export default new WebSocketClient()
