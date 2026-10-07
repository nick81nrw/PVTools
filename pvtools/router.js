import { createRouter, createWebHistory } from 'vue-router'

import HomePage from './pages/HomePage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/impress', component: () => import('./pages/ImpressPage.vue') },
    {
      path: '/consumptionProfiles',
      component: () => import('./pages/ConsumptionProfilesPage.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: (to) =>
    to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 },
})
