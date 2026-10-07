import { createApp } from 'vue'
import { createGtag } from 'vue-gtag'

import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './style.css'

import App from './App.vue'
import router from './router.js'

const app = createApp(App)
app.use(router)

if (__GOOGLE_ANALYTICS_ID__) {
  app.use(
    createGtag({ tagId: __GOOGLE_ANALYTICS_ID__, pageTracker: { router } }),
  )
}

app.mount('#app')
