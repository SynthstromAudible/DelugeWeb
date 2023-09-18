const path = require('path');

module.exports = {
  entry: './src/viewEvents.js',
  watch: true,
  watchOptions: {ignored: 'node_modules/'},
   devtool: 'inline-source-map',
  output: {
    filename: 'viewEvents.js',
	   path: path.resolve(__dirname, './')
  }
};