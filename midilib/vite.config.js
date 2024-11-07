const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    minify: false,
    terserOptions: {
      compress: false,
      mangle: false,
    },
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'MidiLib',
      fileName: (format) => `MidiLib.${format}.js`
    }
  }
});