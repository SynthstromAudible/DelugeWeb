const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'MidiLib',
      fileName: (format) => `MidiLib.${format}.js`
    }
  }
});