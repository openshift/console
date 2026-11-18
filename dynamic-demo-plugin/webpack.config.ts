import type { Configuration } from 'webpack';
import { resolve } from 'path';
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack';
import { CopyRspackPlugin } from '@rspack/core';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const bundler = process.env.BUNDLER ?? 'webpack';
const isRunningWebpack = bundler === 'webpack';
const isRunningRspack = bundler === 'rspack';

// we are using webpack configuration type, so use the webpack CopyPlugin types
const CopyPlugin: typeof CopyWebpackPlugin = isRunningWebpack ? CopyWebpackPlugin : CopyRspackPlugin as any;

if (!isRunningWebpack && !isRunningRspack) {
  throw new Error('Unknown bundler');
}

const config: Configuration = {
  mode: 'development',
  context: resolve(import.meta.dirname, 'src'),
  entry: {},
  ...(isRunningWebpack && { experiments: { css: true } }),
  output: {
    path: resolve(import.meta.dirname, 'dist', isRunningWebpack ? 'webpack' : 'rspack'),
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|tsx?)$/,
        exclude: /node_modules/,
        use: [
          isRunningWebpack
            ? {
                loader: 'ts-loader',
                options: {
                  configFile: resolve(import.meta.dirname, 'tsconfig.json'),
                },
              }
            : {
                loader: 'builtin:swc-loader',
                options: {
                  detectSyntax: 'auto',
                  jsc: {
                    transform: {
                      react: {
                        runtime: 'automatic',
                      },
                    },
                    target: 'es2021',
                  },
                  sourceMaps: true,
                  minify: true,
                },
              },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        ...(isRunningRspack && { use: 'builtin:lightningcss-loader' }),
        type: 'css',
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
    new CopyPlugin({
      patterns: [{ from: resolve(import.meta.dirname, 'locales'), to: 'locales' }],
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
