export function checkWin(board, x, y, color) {
  const GRID_SIZE = 15
  const colorValue = color === 'black' ? 1 : 2
  
  const directions = [
    [[0, 1], [0, -1]],
    [[1, 0], [-1, 0]],
    [[1, 1], [-1, -1]],
    [[1, -1], [-1, 1]]
  ]
  
  for (let dir of directions) {
    let count = 1
    
    for (let [dx, dy] of dir) {
      let nx = x + dx
      let ny = y + dy
      
      while (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && board[nx][ny] === colorValue) {
        count++
        nx += dx
        ny += dy
      }
    }
    
    if (count >= 5) {
      return true
    }
  }
  
  return false
}

export function isValidMove(board, x, y) {
  const GRID_SIZE = 15
  
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return false
  }
  
  return board[x][y] === 0
}

export function createEmptyBoard() {
  return Array(15).fill(null).map(() => Array(15).fill(0))
}
