const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }, {
      test: /\.(jpg|png|jpeg)$/,
      use: 'file-loader'
    }, {
      test: /\.json$/,
      type: 'javascript/auto',
      use: 'file-loader'
    }]
  },
  mode: 'development',
  devtool: 'source-map',
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', '.json' ]
  },
  output: {
    filename: 'bundle.[hash].js',
    path: path.resolve(__dirname, 'docs')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html')
    }),
    new webpack.DefinePlugin({
      IS_DEV: JSON.stringify(process.env.NODE_ENV !== 'production')
    })
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000
  }
}
