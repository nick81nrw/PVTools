import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTrash,
  faPen,
  faSquareCaretUp,
  faSquareCaretDown,
} from '@fortawesome/free-solid-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faTrash, faPen, faSquareCaretUp, faSquareCaretDown)
Vue.component('font-awesome-icon', FontAwesomeIcon)
