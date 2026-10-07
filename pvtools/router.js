import { createRouter, createWebHistory } from 'vue-router'

import IndexPage from './pages/index.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: IndexPage },
    { path: '/impress', component: () => import('./pages/impress/index.vue') },
    {
      path: '/consumptionProfiles',
      component: () => import('./pages/consumptionProfiles/index.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
