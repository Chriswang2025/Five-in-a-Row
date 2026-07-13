<template>
  <canvas 
    ref="canvasRef"
    :width="canvasSize" 
    :height="canvasSize"
    @click="handleClick"
    class="game-board"
  ></canvas>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'GameBoard',
  props: {
    board: {
      type: Array,
      required: true
    },
    canMove: {
      type: Boolean,
      default: false
    }
  },
  emits: ['place-stone'],
  setup(props, { emit }) {
    const canvasRef = ref(null)
    const GRID_SIZE = 15
    const CELL_SIZE = 20
    const PADDING = 15
    const canvasSize = CELL_SIZE * (GRID_SIZE - 1) + PADDING * 2

    const drawBoard = () => {
      const canvas = canvasRef.value
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      
      ctx.fillStyle = '#D2B48C'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 1

      for (let i = 0; i < GRID_SIZE; i++) {
        ctx.beginPath()
        ctx.moveTo(PADDING, PADDING + i * CELL_SIZE)
        ctx.lineTo(PADDING + CELL_SIZE * (GRID_SIZE - 1), PADDING + i * CELL_SIZE)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING)
        ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + CELL_SIZE * (GRID_SIZE - 1))
        ctx.stroke()
      }

      const starPoints = [[3,3], [3,11], [7,7], [11,3], [11,11]]
      starPoints.forEach(([x, y]) => {
        ctx.beginPath()
        ctx.arc(PADDING + x * CELL_SIZE, PADDING + y * CELL_SIZE, 3, 0, 2 * Math.PI)
        ctx.fillStyle = '#8B4513'
        ctx.fill()
      })

      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (props.board[i][j] === 1) {
            drawStone(i, j, 'black')
          } else if (props.board[i][j] === 2) {
            drawStone(i, j, 'white')
          }
        }
      }
    }

    const drawStone = (x, y, color) => {
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      const centerX = PADDING + x * CELL_SIZE
      const centerY = PADDING + y * CELL_SIZE
      const radius = CELL_SIZE * 0.4

      ctx.save()
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      
      if (color === 'black') {
        ctx.fillStyle = '#000'
        ctx.fill()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      } else {
        ctx.fillStyle = '#FFF'
        ctx.fill()
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.restore()
    }

    const handleClick = (event) => {
      if (!props.canMove) return

      const canvas = canvasRef.value
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const gridX = Math.round((x - PADDING) / CELL_SIZE)
      const gridY = Math.round((y - PADDING) / CELL_SIZE)
      
      if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
        if (props.board[gridX][gridY] === 0) {
          emit('place-stone', { x: gridX, y: gridY })
        }
      }
    }

    onMounted(() => {
      drawBoard()
    })

    watch(() => props.board, () => {
      drawBoard()
    }, { deep: true })

    return {
      canvasRef,
      canvasSize,
      handleClick
    }
  }
}
</script>

<style scoped>
.game-board {
  background: #D2B48C;
  border: 2px solid #8B4513;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: block;
}
</style>
