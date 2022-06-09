import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            primary: '#FA4238'
          }
        },
        dark: {
          dark: true,
          colors: {
            primary: '#FA4238'
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
