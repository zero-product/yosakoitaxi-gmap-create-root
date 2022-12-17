import { createApp } from 'vue'
import Vuetify from './plugins/vuetify'
import App from './App.vue'

// import { createVuestic } from 'vuestic-ui'
// import 'vuestic-ui/css'
// import './style.css'

const app = createApp(App)
// app.use(createVuestic())
app.use(Vuetify)
app.mount('#app')
