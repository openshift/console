/* eslint-env node */

import * as webpack from 'webpack';
import * as path from 'path';
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack';
import { CopyRspackPlugin } from '@rspack/core';

const bundler = process.env.BUNDLER ?? 'webpack';
const isRunningWebpack = bundler === 'webpack';
const isRunningRspack = bundler === 'rspack';

const CopyWebpackPlugin = isRunningWebpack ? require('copy-webpack-plugin') : CopyRspackPlugin;

if (!isRunningWebpack && !isRunningRspack) {
  throw new Error('Unknown bundler');
}

const config: webpack.Configuration = {
  mode: 'development',
  context: path.resolve(__dirname, 'src'),
  entry: {},
  output: {
    path: path.resolve(__dirname, 'dist', isRunningWebpack ? 'webpack' : 'rspack'),
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: [
          isRunningWebpack ? {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
            },
          } : {
            loader: 'builtin:swc-loader',
            options: {
              detectSyntax: 'auto',
              jsc: {
                transform: {
                  react: {
                    runtime: "automatic"
                  }
                },
                target: "es2021",
              },
              sourceMaps: true,
              minify: true
            },
          },
        ],
        type: 'javascript/auto'
      },
      {
        test: /\.css$/,
        use: isRunningWebpack ? ['style-loader', 'css-loader'] : 'builtin:lightningcss-loader',
        ...(isRunningRspack && { type: 'css' }), // breaks webpack as it tries to use builtin css parser
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
  plugins: [
    new ConsoleRemotePlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, 'locales'), to: 'locales' }],
    }),
  ],
  devtool: 'source-map',
  optimization: {
    chunkIds: 'named',
    minimize: false,
  },
};

if (process.env.NODE_ENV === 'production') {
  config.mode = 'production';
  config.output.filename = '[name]-bundle-[hash].min.js';
  config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  config.optimization.chunkIds = 'deterministic';
  config.optimization.minimize = true;
}

export default config;
