// See http://brunch.io for documentation.
exports.files = {
  javascripts: {
    joinTo: {
      'app.js': /^app/,
      'vendor.js': /^(?!app)/
    }
  },
  stylesheets: { joinTo: 'app.css' }
}

exports.plugins = {
  babel: {
    "pattern": /\.(js|jsx)$/,
    "presets": ["es2015"],
    "plugins": [
      ["transform-react-jsx", { pragma: 'm' }]
    ]
  },
  // terser: {
  //   mangle: false,
  //   compress: {
  //     global_defs: {
  //       DEBUG: false,
  //     },
  //   },
  // },
  postcss: {
    processors: [
      require('tailwindcss')
    ]
  }
}