<template>
  <div class="matching-container">
    <div class="content">
      <h1 class="title">{{ statusTitle }}</h1>
      
      <div class="loading-animation">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>

      <div class="status-card">
        <div class="status-text">{{ statusText }}</div>
        <div class="queue-info">{{ queueInfo }}</div>
      </div>

      <button class="cancel-button" @click="cancelMatching">取消</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ws from '../utils/websocket.js'

export default {
  name: 'Matching',
  setup() {
    const router = useRouter()
    const statusTitle = ref('寻找对手中...')
    const statusText = ref('正在匹配对手...')
    const queueInfo = ref('当前排队: 0人')

    onMounted(() => {
      ws.send('join_game')

      ws.on('waiting', (data) => {
        statusTitle.value = '寻找对手中...'
        statusText.value = '正在匹配对手...'
        queueInfo.value = `当前排队: ${data.queuePosition}人`
      })

      ws.on('game_busy', (data) => {
        statusTitle.value = '游戏进行中,请等待...'
        statusText.value = '有玩家正在游戏中'
        queueInfo.value = `当前排队: ${data.queuePosition}人`
      })

      ws.on('game_start', (data) => {
        router.push({
          path: '/game',
          query: { color: data.color }
        })
      })

      ws.on('error', (data) => {
        alert(data.message)
        router.push('/')
      })
    })

    onUnmounted(() => {
      ws.off('waiting')
      ws.off('game_busy')
      ws.off('game_start')
      ws.off('error')
    })

    const cancelMatching = () => {
      ws.send('cancel_match')
      ws.disconnect()
      router.push('/')
    }

    return {
      statusTitle,
      statusText,
      queueInfo,
      cancelMatching
    }
  }
}
</script>

<style scoped>
.matching-container {
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
  padding: 60px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 600px;
  justify-content: center;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 40px;
  text-align: center;
}

.loading-animation {
  display: flex;
  gap: 12px;
  margin-bottom: 50px;
}

.dot {
  width: 12px;
  height: 12px;
  background: #1890FF;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-15px);
  }
}

.status-card {
  background: #F5F5F5;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 300px;
  margin-bottom: 40px;
  text-align: center;
}

.status-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.queue-info {
  font-size: 14px;
  color: #8C8C8C;
}

.cancel-button {
  width: 200px;
  height: 48px;
  background: white;
  color: #595959;
  font-size: 16px;
  border: 1px solid #D9D9D9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button:hover {
  border-color: #1890FF;
  color: #1890FF;
}
</style>
