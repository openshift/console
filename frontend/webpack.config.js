/* global __dirname, process */
const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

/* Helpers */
const gitHash = () => require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
const extractSass = new ExtractTextPlugin({filename: 'app-bundle.css'});

let config = {
  entry: {
    app:  './public/components/app.jsx',
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: 'static/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          entryFileIsJs: true,
        }
      },
      {
        test: /\.s?css$/,
        use: extractSass.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              }
            },
            {
              loader: 'resolve-url-loader',
              options: {
                sourceMap: true, 
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                outputStyle: 'compressed',
              }
            },
          ],
          publicPath: './',
        })
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]', 
        },
      },
    ]
  },
  plugins: [
    extractSass,
    new webpack.ProvidePlugin({
      _: 'lodash',
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({resource}) => /node_modules|lib/.test(resource),
    }), 
    new HtmlWebpackPlugin({
      filename: './tokener.html',
      template: './public/tokener.html',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './public/index.html',
      production: process.env.NODE_ENV === 'production',
    }),
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
  ],
  devtool: 'cheap-module-source-map',
};

/* Production settings  */
if (process.env.NODE_ENV === 'production') {
  config.output.filename = `[name]-bundle.${gitHash()}.min.js`;
  config.output.chunkFilename = `[name]-[chunkhash].${gitHash()}.min.js`;
  extractSass.filename = `app-bundle.${gitHash()}.min.css`;
  config.plugins = config.plugins.concat([
    new UglifyJsPlugin({sourceMap: true}),
    new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('production')}),
  ]);
}

module.exports = config;
