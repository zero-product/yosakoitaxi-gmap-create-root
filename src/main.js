import { createApp } from 'vue'
import { createVuestic } from 'vuestic-ui'
import App from './App.vue'

import 'vuestic-ui/css'
import './style.css'

const app = createApp(App)
app.use(createVuestic())
app.mount('#app')
