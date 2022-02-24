const path = require('path');
const webpack = require('webpack');

module.exports = [
  {
    entry: '/Users/derek-lam/dev/x2585/js-src/index.js',
    mode: 'development',
    output: {
      path: path.resolve(__dirname),
      filename: 'static/js/index.main.js'
    },
    // devtool: 'cheap-eval-source-map',
    module: {
      rules: [
        {test: /\.(js|jsx)$/, use: 'babel-loader', exclude: /node_modules/},
        {test: /\.(ts|tsx)$/, use: 'ts-loader', exclude: /node_modules/},
        {
          test: /node_modules\/vanilla-jsx\/lib\/.*\.(js|jsx)$/,
          use: 'babel-loader'
        },
        {
          test: /\.s?css$/,
          use: [{
              loader: "style-loader" // creates style nodes from JS strings
          }, {
              loader: "css-loader" // translates CSS into CommonJS
          }]
        },
        {
          test: /.*/,
          use: []
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
    },
    node: {
      fs: 'empty'
    },
    stats: { warnings: false }
    // plugins: [
    //   new webpack.optimize.UglifyJsPlugin()
    // ],
  }
];