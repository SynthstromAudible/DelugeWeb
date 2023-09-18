const path = require('path');

module.exports = {
  entry: './src/app.js',
  watch: false,
   devtool:  false,
  output: {
    filename: './app.js',
	  path: path.resolve(__dirname, './')
  }
};