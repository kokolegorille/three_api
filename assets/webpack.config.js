const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const outputDir = path.join(__dirname, '../priv/static/');

const isProd = process.env.NODE_ENV === 'production';

module.exports = (env, options) => ({
  optimization: {
    minimizer: [
      new UglifyJsPlugin({ cache: true, parallel: true, sourceMap: false }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  entry: './src/index.js',
  mode: isProd ? 'production' : 'development',
  output: {
    path: outputDir,
    filename: 'js/app.js'
  },
  module: {
    rules: [
      // Load stylesheets
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ]
      },

      // Load images
      {
        test: /\.(png|svg|jpg|gif)(\?.*$|$)/,
        loader: 'url-loader?limit=10000',
      },
      // Load fonts
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?(\?.*$|$)/,
        use: 'url-loader?&limit=10000&name=/fonts/[name].[ext]',
      },
      {
        test: /\.(eot|ttf|otf)?(\?.*$|$)/,
        loader: 'file-loader?&limit=10000&name=/fonts/[name].[ext]',
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: './css/app.css' }),
    new CopyWebpackPlugin([{ from: 'static/', to: './' }]),
  ]
});
