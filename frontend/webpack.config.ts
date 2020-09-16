/* eslint-env node */
import * as webpack from 'webpack';
import * as path from 'path';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as VirtualModulesPlugin from 'webpack-virtual-modules';
import * as ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import { resolvePluginPackages, getActivePluginsModule } from '@console/plugin-sdk/src/codegen';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import { CircularDependencyPreset } from './webpack.circular-deps';
import { sharedVendorModules } from '@console/dynamic-plugin-sdk/src/shared-modules';

interface Configuration extends webpack.Configuration {
  devServer?: WebpackDevServerConfiguration;
}

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const { SUPPORTED_LOCALES } = require('./public/i18next-parser.config');

const NODE_ENV = process.env.NODE_ENV || 'development';
const HOT_RELOAD = process.env.HOT_RELOAD || 'true';
const CHECK_CYCLES = process.env.CHECK_CYCLES || 'false';
const IS_WDS = process.env.WEBPACK_DEV_SERVER;
const WDS_PORT = 8080;

/* Helpers */
const extractCSS = new MiniCssExtractPlugin({ filename: 'app-bundle.[contenthash].css' });
const overpassTest = /overpass-.*\.(woff2?|ttf|eot|otf)(\?.*$|$)/;
const sharedVendorTest = new RegExp(`node_modules\\/(${sharedVendorModules.join('|')})\\/`);

const config: Configuration = {
  entry: [
    './polyfills.js',
    './public/components/app.jsx',
    'monaco-editor-core/esm/vs/editor/editor.worker.js',
  ],
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: 'static/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].js',
  },
  devServer: {
    writeToDisk: true,
    progress: true,
    hot: HOT_RELOAD !== 'false',
    inline: HOT_RELOAD !== 'false',
    contentBase: false,
    transportMode: 'ws',
    port: WDS_PORT,
  },
  resolve: {
    extensions: ['.glsl', '.ts', '.tsx', '.js', '.jsx'],
  },
  node: {
    fs: 'empty',
    // eslint-disable-next-line camelcase
    child_process: 'empty',
    net: 'empty',
    crypto: 'empty',
    module: 'empty',
  },
  module: {
    rules: [
      {
        // Disable tree shaking on modules shared with Console dynamic plugins
        test: sharedVendorTest,
        sideEffects: true,
      },
      { test: /\.glsl$/, loader: 'raw!glslify' },
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules\/(?!(bitbucket|ky)\/)/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'thread-loader',
            options: {
              // Leave one core spare for fork-ts-checker-webpack-plugin
              workers: require('os').cpus().length - 1,
            },
          },
          ...(IS_WDS
            ? [
                {
                  loader: 'babel-loader',
                  options: {
                    plugins: ['react-refresh/babel'],
                  },
                },
              ]
            : []),
          {
            loader: 'ts-loader',
            options: {
              // Always use the root tsconfig.json. Packages might have a separate tsconfig.json for storybook.
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              happyPackMode: true, // This implicitly enables transpileOnly! No type checking!
              transpileOnly: true, // fork-ts-checker-webpack-plugin takes care of type checking
            },
          },
        ],
      },
      {
        test: /node_modules[\\\\|/](yaml-language-server)/,
        loader: 'umd-compat-loader',
      },
      {
        test: /node_modules[\\\\|/](vscode-json-languageservice)/,
        loader: 'umd-compat-loader',
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
        test: /\.css$/,
        include: path.resolve(__dirname, './node_modules/monaco-editor'),
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        exclude: overpassTest,
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]',
        },
      },
      {
        // Resolve to an empty module for overpass fonts included in SASS files.
        // This way file-loader won't parse them. Make sure this is BELOW the
        // file-loader rule.
        test: overpassTest,
        loader: 'null-loader',
      },
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
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
    new webpack.NormalModuleReplacementPlugin(/^lodash$/, 'lodash-es'),
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
    new MonacoWebpackPlugin({
      languages: ['yaml'],
    }),
    new CopyWebpackPlugin([{ from: './public/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/console-shared/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/console-app/locales', to: 'locales' }]),
    new CopyWebpackPlugin([
      { from: './packages/operator-lifecycle-manager/locales', to: 'locales' },
    ]),
    new MomentLocalesPlugin({
      localesToKeep: Object.keys(SUPPORTED_LOCALES).map((key) => (key === 'zh' ? 'zh-cn' : key)),
    }),
    new webpack.IgnorePlugin(/prettier/),
    extractCSS,
    ...(IS_WDS
      ? [
          new ReactRefreshWebpackPlugin({
            overlay: {
              sockPort: WDS_PORT,
            },
          }),
        ]
      : []),
  ],
  devtool: 'cheap-module-source-map',
  stats: 'minimal',
};

if (CHECK_CYCLES === 'true') {
  new CircularDependencyPreset({
    exclude: /node_modules|public\/dist/,
    reportFile: '.webpack-cycles',
    thresholds: {
      minLengthCycles: 17,
    },
  }).apply(config.plugins);
}

/* Production settings */
if (NODE_ENV === 'production') {
  config.output.filename = '[name]-bundle-[hash].min.js';
  config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  extractCSS.filename = '[name]-[chunkhash].min.css';
  // Causes error in --mode=production due to scope hoisting
  config.optimization.concatenateModules = false;
  config.stats = 'normal';
}

/* Console plugin support */
config.plugins.push(
  new VirtualModulesPlugin({
    'node_modules/@console/active-plugins.js': getActivePluginsModule(resolvePluginPackages()),
  }),
);

export default config;
