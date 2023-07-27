/* eslint-env node */
import * as webpack from 'webpack';
import * as path from 'path';
import * as _ from 'lodash';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import { sharedPluginModules } from '@console/dynamic-plugin-sdk/src/shared-modules';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';
import { ConsoleActivePluginsModule } from '@console/plugin-sdk/src/webpack/ConsoleActivePluginsModule';
import { CircularDependencyPreset } from './webpack.circular-deps';

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

interface Configuration extends webpack.Configuration {
  devServer?: WebpackDevServerConfiguration;
}

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const VirtualModulesPlugin = require('webpack-virtual-modules');

const NODE_ENV = process.env.NODE_ENV || 'development';
const HOT_RELOAD = process.env.HOT_RELOAD || 'true';
const CHECK_CYCLES = process.env.CHECK_CYCLES || 'false';
const ANALYZE_BUNDLE = process.env.ANALYZE_BUNDLE || 'false';
const REACT_REFRESH = process.env.REACT_REFRESH;
const OPENSHIFT_CI = process.env.OPENSHIFT_CI;
const WDS_PORT = 8080;

/* Helpers */
const extractCSS = new MiniCssExtractPlugin({
  filename:
    NODE_ENV === 'production' ? 'app-bundle.[contenthash].css' : 'app-bundle.[name].[hash].css',
  // We follow BEM naming to scope CSS.
  // See https://github.com/webpack-contrib/mini-css-extract-plugin/issues/250
  ignoreOrder: true,
});
const getVendorModuleRegExp = (vendorModules: string[]) =>
  new RegExp(`node_modules\\/(${vendorModules.map((m) => _.escapeRegExp(m)).join('|')})\\/`);
const virtualModules = new VirtualModulesPlugin();
const overpassTest = /overpass-.*\.(woff2?|ttf|eot|otf)(\?.*$|$)/;
const sharedPluginTest = getVendorModuleRegExp(Object.keys(sharedPluginModules));
const sharedPatternFlyCoreTest = getVendorModuleRegExp([
  '@patternfly/react-core',
  '@patternfly/react-table',
]);

const config: Configuration = {
  entry: ['./public/components/app.jsx', 'monaco-editor-core/esm/vs/editor/editor.worker.js'],
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: 'static/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].js',
  },
  devServer: {
    hot: HOT_RELOAD !== 'false',
    webSocketServer: 'ws',
    port: WDS_PORT,
    static: false,
    devMiddleware: {
      writeToDisk: true,
    },
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
        test: sharedPluginTest,
        sideEffects: true,
      },
      { test: /\.glsl$/, loader: 'raw!glslify' },
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules\/(?!(bitbucket|ky)\/)/,
        use: [
          { loader: 'cache-loader' },
          // Disable thread-loader in CI
          ...(!OPENSHIFT_CI
            ? [
                {
                  loader: 'thread-loader',
                },
              ]
            : []),
          ...(REACT_REFRESH
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
        test: /prettier\/parser-yaml/,
        loader: 'null-loader',
      },
      {
        test: /prettier/,
        loader: 'null-loader',
      },
      {
        test: /node_modules[\\\\|/](vscode-json-languageservice)/,
        loader: 'umd-compat-loader',
      },
      {
        test: /\.s?css$/,
        exclude: /node_modules\/(?!(@patternfly|@console\/plugin-shared)\/).*/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: './',
            },
          },
          { loader: 'cache-loader' },
          ...(!OPENSHIFT_CI ? [{ loader: 'thread-loader' }] : []),
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'resolve-url-loader',
            // https://github.com/bholloway/resolve-url-loader/blob/v4-maintenance/packages/resolve-url-loader/README.md#options
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                outputStyle: 'compressed',
              },
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
      cacheGroups: {
        vendor: {
          test: sharedPatternFlyCoreTest,
          name: 'vendor-patternfly-core',
        },
      },
    },
    runtimeChunk: true,
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^lodash$/, 'lodash-es'),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.json'),
        diagnosticOptions: { syntactic: true, semantic: true },
        memoryLimit: 4096,
      },
    }),
    new HtmlWebpackPlugin({
      filename: './tokener.html',
      template: './public/tokener.html',
      inject: false,
      chunksSortMode: 'none',
    }),
    // TODO Remove multicluster
    new HtmlWebpackPlugin({
      filename: './multicluster-logout.html',
      template: './public/multicluster-logout.html',
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
      languages: ['yaml', 'dockerfile', 'json', 'plaintext'],
    }),
    new CopyWebpackPlugin([{ from: './public/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/console-shared/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/console-app/locales', to: 'locales' }]),
    new CopyWebpackPlugin([
      { from: './packages/operator-lifecycle-manager/locales', to: 'locales' },
    ]),
    new CopyWebpackPlugin([{ from: './packages/dev-console/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/knative-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/container-security/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/pipelines-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/service-binding-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/shipwright-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/webterminal-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/topology/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/helm-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/rhoas-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/git-service/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/gitops-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/kubevirt-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/ceph-storage-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/metal3-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/vsphere-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([
      { from: './packages/network-attachment-definition-plugin/locales', to: 'locales' },
    ]),
    new CopyWebpackPlugin([{ from: './packages/patternfly/locales', to: 'locales' }]),
    new CopyWebpackPlugin([{ from: './packages/insights-plugin/locales', to: 'locales' }]),
    new CopyWebpackPlugin([
      { from: './packages/local-storage-operator-plugin/locales', to: 'locales' },
    ]),
    extractCSS,
    virtualModules,
    new ConsoleActivePluginsModule(resolvePluginPackages(), virtualModules),
    ...(REACT_REFRESH
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
    thresholds: { minLengthCycles: 18 },
  }).apply(config.plugins);
}

if (ANALYZE_BUNDLE === 'true') {
  config.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'report.html',
      // Don't open report in default browser automatically
      openAnalyzer: false,
    }),
  );
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

export default config;
