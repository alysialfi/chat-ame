// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  modules: ['@nuxtjs/supabase', '@nuxtjs/mdc'],
  runtimeConfig: {
    opencodeApiKey: process.env.OPENCODE_API_KEY,
    public: {
      // later
    }
  },
	devServer: {
    port: 3030
  }
})
