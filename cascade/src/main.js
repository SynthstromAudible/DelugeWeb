import './assets/main.css'
import { createApp } from 'vue'
import router from './router/index.js'
import App from './Cascade.vue'

createApp(App)
.use(router)
.mount('#app')
