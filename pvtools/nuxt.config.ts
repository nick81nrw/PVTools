// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: ['vuetify-nuxt-module'],
  vuetify: {
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      /* vuetify options */
      icons: {
        defaultSet: 'mdi', // This is already the default value - only for display purposes
      },
    },
  },
  devtools: { enabled: true },
})
