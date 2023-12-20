// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig : {
    public:{
      apiBase:"http://localhost:3300"
    },
  },
  modules: ['@nuxt/ui']
})
