/* eslint-env node */
import * as webpack from 'webpack';
import * as path from 'path';
import * as glob from 'glob';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as VirtualModulesPlugin from 'webpack-virtual-modules';
import { getActivePluginsModule } from '@console/plugin-sdk/src/codegen';

const NODE_ENV = process.env.NODE_ENV;

/* Helpers */
const extractCSS = new MiniCssExtractPlugin({filename: 'app-bundle.css'});
const packageFiles = glob.sync('packages/*/package.json', { absolute: true });

const config: webpack.Configuration = {
  entry: ['./polyfills.js', '@console/app'],
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: 'static/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].js',
  },
  resolve: {
    extensions: ['.glsl', '.ts', '.tsx', '.js', '.jsx'],
  },
  node: {
    fs: 'empty',
  },
  module: {
    rules: [
      { test: /\.glsl$/, loader: 'raw!glslify' },
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'thread-loader',
            options: {
              // Leave one core spare for fork-ts-checker-webpack-plugin
              workers: require('os').cpus().length - 1,
            },
          },
          {
            loader: 'ts-loader',
            options: {
              happyPackMode: true, // This implicitly enables transpileOnly! No type checking!
              transpileOnly: true, // fork-ts-checker-webpack-plugin takes care of type checking
            },
          },
        ],
      },
      {
        test: /\.s?css$/,
        exclude: /node_modules\/(?!(@patternfly)\/).*/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: './',
            },
          },
          { loader: 'cache-loader' },
          { loader: 'thread-loader' },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'resolve-url-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              outputStyle: 'compressed',
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]',
        },
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: true,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }),
    new HtmlWebpackPlugin({
      filename: './tokener.html',
      template: './public/tokener.html',
      inject: false,
      chunksSortMode: 'none',
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './public/index.html',
      production: NODE_ENV === 'production',
      chunksSortMode: 'none',
    }),
    extractCSS,
    // Generate '@console/active-plugins' module
    new VirtualModulesPlugin({
      'node_modules/@console/active-plugins.js': getActivePluginsModule(packageFiles),
    }),
  ],
  devtool: 'cheap-module-source-map',
  stats: 'minimal',
};

/* Production settings */
if (NODE_ENV === 'production') {
  config.output.filename = '[name]-bundle-[hash].min.js';
  config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  extractCSS.filename = '[name]-[chunkhash].min.css';
  // Causes error in --mode=production due to scope hoisting
  config.optimization.concatenateModules = false;
  config.stats = 'normal';
}

export default config;
