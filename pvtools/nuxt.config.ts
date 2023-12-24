// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: ['nuxt-quasar-ui', '@nuxt/test-utils/module', 'nuxt-gtag'],
  app: {
    head: {
      title: 'PVTool @AkkuDoktor - Berechne die Größe deines Speichers selbst',
      htmlAttrs: {
        lang: 'de',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: '' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  gtag: {
    id: process.env.GOOGLE_ANALYTICS_ID,
    initialConsent: false,
  },
  devtools: { enabled: true },
})
