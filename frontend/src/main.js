import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import Matching from './views/Matching.vue'
import Game from './views/Game.vue'
import './style.css'

const routes = [
  { path: '/', component: Home },
  { path: '/matching', component: Matching },
  { path: '/game', component: Game }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')
