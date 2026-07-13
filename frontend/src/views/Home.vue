<template>
  <div class="home-container">
    <div class="content">
      <h1 class="title">五子棋对战</h1>
      
      <div class="board-preview">
        <svg class="board-grid" viewBox="0 0 180 180">
          <line class="grid-line" x1="0" y1="0" x2="180" y2="0" />
          <line class="grid-line" x1="0" y1="45" x2="180" y2="45" />
          <line class="grid-line" x1="0" y1="90" x2="180" y2="90" />
          <line class="grid-line" x1="0" y1="135" x2="180" y2="135" />
          <line class="grid-line" x1="0" y1="180" x2="180" y2="180" />
          <line class="grid-line" x1="0" y1="0" x2="0" y2="180" />
          <line class="grid-line" x1="45" y1="0" x2="45" y2="180" />
          <line class="grid-line" x1="90" y1="0" x2="90" y2="180" />
          <line class="grid-line" x1="135" y1="0" x2="135" y2="180" />
          <line class="grid-line" x1="180" y1="0" x2="180" y2="180" />
          <circle cx="45" cy="45" r="3" fill="#8B4513" />
          <circle cx="90" cy="90" r="3" fill="#8B4513" />
          <circle cx="135" cy="135" r="3" fill="#8B4513" />
        </svg>
        
        <div class="stone black" style="top: 35px; left: 35px;"></div>
        <div class="stone white" style="top: 35px; left: 125px;"></div>
        <div class="stone black" style="top: 80px; left: 80px;"></div>
        <div class="stone white" style="top: 125px; left: 125px;"></div>
      </div>

      <button 
        class="start-button" 
        :disabled="connecting"
        @click="startGame"
      >
        {{ connecting ? '连接中...' : '开始游戏 🎮' }}
      </button>

      <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ws from '../utils/websocket.js'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()
    const connecting = ref(false)
    const errorMessage = ref('')

    const startGame = async () => {
      connecting.value = true
      errorMessage.value = ''

      try {
        await ws.connect()
        router.push('/matching')
      } catch (error) {
        console.error('连接失败:', error)
        errorMessage.value = '网络连接失败，请检查网络'
        connecting.value = false
      }
    }

    return {
      connecting,
      errorMessage,
      startGame
    }
  }
}
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.content {
  width: 100%;
  max-width: 375px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 60px 30px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 600px;
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin-bottom: 40px;
  text-align: center;
}

.board-preview {
  width: 200px;
  height: 200px;
  background: #D2B48C;
  border: 2px solid #8B4513;
  border-radius: 8px;
  position: relative;
  margin-bottom: 60px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.board-grid {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
}

.grid-line {
  stroke: #8B4513;
  stroke-width: 1;
}

.stone {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.stone.black {
  background: #000;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.stone.white {
  background: #fff;
  border: 1px solid #333;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.start-button {
  width: 240px;
  height: 56px;
  background: #1890FF;
  color: white;
  font-size: 18px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transition: all 0.3s;
}

.start-button:hover:not(:disabled) {
  background: #0050B3;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.5);
}

.start-button:active:not(:disabled) {
  transform: translateY(0);
}

.start-button:disabled {
  background: #D9D9D9;
  cursor: not-allowed;
  box-shadow: none;
}

.error-message {
  margin-top: 20px;
  color: #FF4D4F;
  font-size: 14px;
  text-align: center;
}
</style>
