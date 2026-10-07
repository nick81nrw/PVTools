import { createApp } from 'vue'
import { createGtag } from 'vue-gtag'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTrash,
  faPen,
  faSquareCaretUp,
  faSquareCaretDown,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import App from './App.vue'
import router from './router.js'

library.add(faTrash, faPen, faSquareCaretUp, faSquareCaretDown)

const app = createApp(App)
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)

if (__GOOGLE_ANALYTICS_ID__) {
  app.use(
    createGtag({ tagId: __GOOGLE_ANALYTICS_ID__, pageTracker: { router } }),
  )
}

app.mount('#app')
