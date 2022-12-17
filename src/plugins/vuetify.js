import { createVuetify } from 'vuetify'
// import { md1, md2, md3 } from 'vuetify/blueprints'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import colors from 'vuetify/lib/util/colors'
export default createVuetify({
  // blueprint: md3,
  icons: {
    defaultSet: 'mdi',
  },
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 340,
      md: 540,
      lg: 800,
      xl: 1280,
    },
  },
  theme: {
    dark: false,
    colors: {
      primary: colors.lightBlue,
    },

  }
})