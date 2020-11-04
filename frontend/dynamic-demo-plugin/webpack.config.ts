/* eslint-env node */

import * as webpack from 'webpack';
import * as path from 'path';
import { ConsoleRemotePlugin } from '@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin';

const config: webpack.Configuration = {
  context: path.resolve(__dirname, 'src'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'http://localhost:9001/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
            },
          },
        ],
      },
    ],
  },
  plugins: [new ConsoleRemotePlugin()],
  mode: 'development',
  devtool: 'source-map',
  optimization: {
    chunkIds: 'named',
    minimize: false,
  },
};

if (process.env.NODE_ENV === 'production') {
  config.output.filename = '[name]-bundle-[hash].min.js';
  config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  config.mode = 'production';
  config.optimization.chunkIds = 'deterministic';
  config.optimization.minimize = true;
}

export default config;
