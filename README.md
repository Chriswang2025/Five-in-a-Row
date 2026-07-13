# 五子棋在线对战游戏

> 双人在线五子棋H5游戏，支持随机匹配、实时对战、断线重连

## 📁 项目结构

```
五子棋/
├── frontend/                 # 前端项目（Vue.js）
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   │   ├── Home.vue     # 首页
│   │   │   ├── Matching.vue # 匹配页
│   │   │   └── Game.vue     # 游戏页
│   │   ├── components/
│   │   │   └── GameBoard.vue # 棋盘组件
│   │   ├── utils/
│   │   │   └── websocket.js  # WebSocket管理
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                  # 后端项目（Node.js）
│   ├── server.js            # WebSocket服务器
│   ├── game.js              # 游戏逻辑
│   └── package.json
│
├── prototype/                # HTML原型（仅供参考）
├── docs/                     # 设计文档
└── README.md                 # 本文件
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. 安装依赖

**前端：**
```bash
cd frontend
npm install
```

**后端：**
```bash
cd backend
npm install
```

### 2. 启动后端服务器

```bash
cd backend
npm start
```

后端将运行在 `ws://localhost:8080`

### 3. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

前端将运行在 `http://localhost:3000`

### 4. 开始游戏

1. 用浏览器打开 `http://localhost:3000`
2. 点击"开始游戏"
3. 用另一个浏览器标签页（或无痕模式）再次打开相同地址
4. 两个玩家自动匹配，开始游戏！

## 🎮 游戏功能

### 核心功能
- ✅ 随机匹配（先来先配）
- ✅ 15×15标准五子棋
- ✅ 实时对战（WebSocket）
- ✅ 断线重连（30秒容错）
- ✅ 等待队列（单房间模式）
- ✅ 认输功能
- ✅ 胜负判断

### 游戏规则
- 黑方先手
- 连成5子获胜
- 无禁手规则
- 同时只支持1局游戏，其他玩家排队

### 用户路径
```
首页 → 匹配页 → 游戏页 → 结束 → 返回首页
```

## 📦 部署到Render.com

### 部署后端

1. 在Render创建新的**Web Service**
2. 连接你的GitHub仓库
3. 配置：
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variable**: `PORT=10000`
4. 点击"Create Web Service"
5. 获得后端地址，例如：`wss://your-backend.onrender.com`

### 部署前端

1. 修改前端WebSocket地址：
   ```javascript
   // frontend/src/utils/websocket.js
   this.url = 'wss://your-backend.onrender.com'
   ```

2. 在Render创建新的**Static Site**
3. 配置：
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. 点击"Create Static Site"
5. 获得前端地址，例如：`https://your-frontend.onrender.com`

### 完成！

访问前端地址，开始游戏！

## 🛠 技术栈

### 前端
- **Vue.js 3** - 响应式框架
- **Vue Router** - 路由管理
- **Vite** - 构建工具
- **Canvas API** - 绘制棋盘
- **WebSocket** - 实时通信

### 后端
- **Node.js** - 运行环境
- **ws** - WebSocket库

### 部署
- **Render.com** - 免费云平台

## 📨 通信协议

### 前端 → 后端

| 消息类型 | 数据 | 说明 |
|---------|------|------|
| `join_game` | `{userId}` | 加入游戏 |
| `place_stone` | `{userId, x, y}` | 下棋 |
| `resign` | `{userId}` | 认输 |
| `reconnect` | `{userId}` | 重连 |
| `cancel_match` | `{userId}` | 取消匹配 |

### 后端 → 前端

| 消息类型 | 数据 | 说明 |
|---------|------|------|
| `waiting` | `{queuePosition}` | 等待匹配 |
| `game_busy` | `{message, queuePosition}` | 游戏进行中 |
| `game_start` | `{color, currentTurn}` | 游戏开始 |
| `board_update` | `{x, y, color, currentTurn}` | 棋盘更新 |
| `game_over` | `{winner, reason}` | 游戏结束 |
| `opponent_disconnect` | `{remainingTime}` | 对手断线 |
| `game_resume` | `{board, color, currentTurn}` | 恢复游戏 |
| `error` | `{message}` | 错误提示 |

## 🧪 本地测试

### 测试断线重连

1. 启动后端和前端
2. 用两个浏览器窗口开始游戏
3. 关闭其中一个窗口（模拟断线）
4. 另一个窗口会显示"对手断线中...剩余XX秒"
5. 30秒内重新打开窗口 → 游戏恢复
6. 超过30秒 → 对方获胜

### 测试排队功能

1. 启动后端和前端
2. 打开3个浏览器窗口
3. 前2个自动匹配开始游戏
4. 第3个窗口显示"游戏进行中，请等待...当前排队: 1人"
5. 前2个游戏结束后，系统会自动为等待的玩家匹配

## 🐛 常见问题

### 1. WebSocket连接失败

**问题**：前端显示"网络连接失败"

**解决**：
- 检查后端是否启动（`npm start`在backend目录）
- 检查端口8080是否被占用
- 确认前端WebSocket地址配置正确

### 2. 页面显示空白

**问题**：打开前端只看到渐变背景

**解决**：
- 检查前端是否运行（`npm run dev`在frontend目录）
- 清除浏览器缓存
- 查看浏览器控制台错误信息

### 3. 匹配后无法下棋

**问题**：游戏开始但点击棋盘无反应

**解决**：
- 确认是否轮到你（看顶部状态："轮到你了!"）
- 检查后端日志是否有错误
- 刷新页面重新开始

## 📝 开发说明

### 修改WebSocket地址

如果后端端口不是8080，需要修改前端配置：

```javascript
// frontend/src/utils/websocket.js 第3行
this.url = 'ws://localhost:你的端口'
```

### 修改棋盘大小

如果想调整棋盘显示大小：

```javascript
// frontend/src/components/GameBoard.vue 第23-25行
const GRID_SIZE = 15    // 格子数量
const CELL_SIZE = 20    // 每格大小（像素）
const PADDING = 15      // 边距
```

### 修改断线等待时间

如果想调整30秒断线容错：

```javascript
// backend/server.js 第158行
disconnectedPlayer.disconnectTimer = setTimeout(() => {
  // ...
}, 30000)  // 改成其他值（毫秒）
```

## 📄 许可证

MIT

## 👥 贡献

欢迎提交Issue和Pull Request！

---

**开发日期**: 2026年7月7日  
**版本**: v1.0
