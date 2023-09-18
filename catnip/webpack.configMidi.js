const path = require('path');

module.exports = {
  entry: './src/app.js',
  watch: true,
  watchOptions: {ignored: 'node_modules/'},
   devtool: 'inline-source-map',
  output: {
    filename: 'app.js',
	   path: path.resolve(__dirname, './')
//   path: "/Volumes/NO NAME/DR/FTF"
  }
};