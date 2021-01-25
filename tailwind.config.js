module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: [
    './app/**/*.html',
    './app/**/*.js'
  ],
  theme: {
    container: {
      center: true,
    }
  },
  variants: {},
  plugins: [],
}