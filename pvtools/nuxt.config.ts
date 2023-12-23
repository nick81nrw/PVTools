// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: ['nuxt-quasar-ui', '@nuxt/test-utils/module'],
  devtools: { enabled: true },
})
