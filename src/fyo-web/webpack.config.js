const path = require('path');

module.exports = {
  entry: './src/fyo-web/src/index.ts', // Your main TypeScript file
  output: {
    filename: 'fyo-web.js', // The output single JavaScript file
    path: path.resolve(__dirname, '../../fyowebbuild')
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  mode: 'production' // Use 'development' for unminified, easier-to-debug output
};