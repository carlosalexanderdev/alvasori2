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
            primary: '#cc3334'
          }
        },
        dark: {
          dark: true,
          colors: {
            primary: '#cc3334'
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
