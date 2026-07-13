<template>
  <div class="game-container">
    <div class="content">
      <div class="info-bar">
        <div class="player-info">
          你是: <span>{{ playerColor === 'black' ? '⚫ 黑方' : '⚪ 白方' }}</span>
        </div>
        <div class="status-info" :class="statusClass">{{ statusText }}</div>
      </div>

      <div class="board-container">
        <GameBoard 
          :board="board" 
          :canMove="canMove"
          @place-stone="placeStone"
        />
      </div>

      <div class="bottom-actions">
        <button class="resign-button" @click="showResignConfirm">认输</button>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-icon">{{ modalIcon }}</div>
        <div class="modal-title" :class="modalTitleClass">{{ modalTitle }}</div>
        <div class="modal-subtitle">{{ modalSubtitle }}</div>
        <div class="modal-buttons">
          <button class="modal-button primary" @click="playAgain">再来一局</button>
          <button class="modal-button secondary" @click="goHome">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import GameBoard from '../components/GameBoard.vue'
import ws from '../utils/websocket.js'

export default {
  name: 'Game',
  components: {
    GameBoard
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const playerColor = ref(route.query.color || 'black')
    const currentTurn = ref('black')
    const board = ref(Array(15).fill(null).map(() => Array(15).fill(0)))
    const statusText = ref('等待游戏开始...')
    const showModal = ref(false)
    const modalIcon = ref('🎉')
    const modalTitle = ref('你赢了!')
    const modalSubtitle = ref('五子连珠!')
    const disconnectTimer = ref(null)
    const remainingTime = ref(30)

    const canMove = computed(() => {
      return currentTurn.value === playerColor.value
    })

    const statusClass = computed(() => {
      if (statusText.value.includes('轮到你了')) return 'your-turn'
      if (statusText.value.includes('断线')) return 'disconnect'
      return 'waiting'
    })

    const modalTitleClass = computed(() => {
      return modalTitle.value.includes('赢') ? 'win' : 'lose'
    })

    const updateStatus = () => {
      if (currentTurn.value === playerColor.value) {
        statusText.value = '轮到你了!'
      } else {
        statusText.value = '等待对方...'
      }
    }

    const placeStone = ({ x, y }) => {
      ws.send('place_stone', { x, y })
    }

    const showResignConfirm = () => {
      if (confirm('确认认输吗？')) {
        ws.send('resign')
      }
    }

    const closeModal = () => {
      showModal.value = false
    }

    const playAgain = () => {
      ws.disconnect()
      router.push('/')
    }

    const goHome = () => {
      ws.disconnect()
      router.push('/')
    }

    onMounted(() => {
      ws.on('board_update', (data) => {
        board.value[data.x][data.y] = data.color === 'black' ? 1 : 2
        currentTurn.value = data.currentTurn
        updateStatus()
      })

      ws.on('game_over', (data) => {
        if (data.winner === playerColor.value) {
          modalIcon.value = '🎉'
          modalTitle.value = '你赢了!'
          modalSubtitle.value = data.reason === 'five_in_row' ? '五子连珠!' : '对方超时未连接'
        } else {
          modalIcon.value = '😢'
          modalTitle.value = '你输了...'
          modalSubtitle.value = data.reason === 'five_in_row' ? '对方五子连珠' : '你已认输'
        }
        showModal.value = true
      })

      ws.on('opponent_disconnect', (data) => {
        remainingTime.value = data.remainingTime
        statusText.value = `对手断线中...剩余${remainingTime.value}秒`
        
        if (disconnectTimer.value) {
          clearInterval(disconnectTimer.value)
        }
        
        disconnectTimer.value = setInterval(() => {
          remainingTime.value--
          if (remainingTime.value > 0) {
            statusText.value = `对手断线中...剩余${remainingTime.value}秒`
          } else {
            clearInterval(disconnectTimer.value)
          }
        }, 1000)
      })

      ws.on('game_resume', (data) => {
        if (disconnectTimer.value) {
          clearInterval(disconnectTimer.value)
          disconnectTimer.value = null
        }
        
        board.value = data.board
        currentTurn.value = data.currentTurn
        updateStatus()
      })

      ws.on('error', (data) => {
        alert(data.message)
      })

      updateStatus()
    })

    onUnmounted(() => {
      if (disconnectTimer.value) {
        clearInterval(disconnectTimer.value)
      }
      ws.off('board_update')
      ws.off('game_over')
      ws.off('opponent_disconnect')
      ws.off('game_resume')
      ws.off('error')
    })

    return {
      playerColor,
      board,
      statusText,
      statusClass,
      canMove,
      showModal,
      modalIcon,
      modalTitle,
      modalSubtitle,
      modalTitleClass,
      placeStone,
      showResignConfirm,
      closeModal,
      playAgain,
      goHome
    }
  }
}
</script>

<style scoped>
.game-container {
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.info-bar {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #F0F0F0;
}

.player-info {
  font-size: 16px;
  color: #333;
  margin-bottom: 6px;
}

.status-info {
  font-size: 14px;
  font-weight: 500;
}

.status-info.your-turn {
  color: #1890FF;
}

.status-info.waiting {
  color: #8C8C8C;
}

.status-info.disconnect {
  color: #FA8C16;
}

.board-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.bottom-actions {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.resign-button {
  width: 120px;
  height: 44px;
  background: white;
  color: #FF4D4F;
  font-size: 16px;
  border: 1px solid #FF4D4F;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.resign-button:hover {
  background: #FFF1F0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  border-radius: 16px;
  width: 280px;
  padding: 30px;
  text-align: center;
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.modal-title.win {
  color: #52C41A;
}

.modal-title.lose {
  color: #FF4D4F;
}

.modal-subtitle {
  font-size: 14px;
  color: #8C8C8C;
  margin-bottom: 24px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

.modal-button {
  flex: 1;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  border: none;
  transition: all 0.3s;
}

.modal-button.primary {
  background: #1890FF;
  color: white;
}

.modal-button.primary:hover {
  background: #0050B3;
}

.modal-button.secondary {
  background: white;
  color: #595959;
  border: 1px solid #D9D9D9;
}

.modal-button.secondary:hover {
  border-color: #1890FF;
  color: #1890FF;
}
</style>
