/* eslint-env node */
import * as ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as _ from 'lodash';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as path from 'path';
import * as webpack from 'webpack';
import { WebpackSharedObject, WebpackSharedConfig } from '@openshift/dynamic-plugin-sdk-webpack';

import {
  sharedPluginModules,
  getSharedModuleMetadata,
} from '@console/dynamic-plugin-sdk/src/shared-modules/shared-modules-meta';
import { ExtensionValidatorPlugin } from '@console/dynamic-plugin-sdk/src/webpack/ExtensionValidatorPlugin';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';
import { HtmlWebpackSkipAssetsPlugin } from 'html-webpack-skip-assets-plugin';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import { CircularDependencyPreset } from './webpack.circular-deps';

interface Configuration extends webpack.Configuration {
  devServer?: WebpackDevServerConfiguration;
}

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const NODE_ENV = process.env.NODE_ENV || 'development';
const HOT_RELOAD = process.env.HOT_RELOAD || 'true';
const CHECK_CYCLES = process.env.CHECK_CYCLES || 'false';
const ANALYZE_BUNDLE = process.env.ANALYZE_BUNDLE || 'false';
const REACT_REFRESH = process.env.REACT_REFRESH;
const OPENSHIFT_CI = process.env.OPENSHIFT_CI;
const WDS_PORT = 8080;

/* Helpers */
const pluginPackages = resolvePluginPackages();

const extractCSS = new MiniCssExtractPlugin({
  filename: 'app-bundle.[name].[contenthash].css',
  // We follow BEM naming to scope CSS.
  // See https://github.com/webpack-contrib/mini-css-extract-plugin/issues/250
  ignoreOrder: true,
});

const getVendorModuleRegExp = (vendorModules: string[]) =>
  new RegExp(`node_modules\\/(${vendorModules.map(_.escapeRegExp).join('|')})\\/`);

/** Custom hook to rewrite Console provided shared module imports as needed */
const getSharedModuleImport = (moduleName: string) => {
  switch (moduleName) {
    case '@openshift-console/dynamic-plugin-sdk':
      return '@console/dynamic-plugin-sdk/src/lib-core';
    case '@openshift-console/dynamic-plugin-sdk-internal':
      return '@console/dynamic-plugin-sdk/src/lib-internal';
    default:
      return moduleName;
  }
};

const sharedPluginModulesTest = getVendorModuleRegExp(
  sharedPluginModules.map(getSharedModuleImport),
);

// Shared modules provided by Console application to all dynamic plugins
// https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
const consoleProvidedSharedModules = sharedPluginModules.reduce<WebpackSharedObject>(
  (acc, moduleName) => {
    const { singleton } = getSharedModuleMetadata(moduleName);
    const moduleConfig: WebpackSharedConfig = { singleton, eager: true };

    moduleConfig.import = getSharedModuleImport(moduleName);

    acc[moduleName] = moduleConfig;
    return acc;
  },
  {},
);

const config: Configuration = {
  entry: {
    main: ['./public/components/app.tsx'],
  },
  cache: {
    type: 'filesystem',
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: 'static/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].js',
  },
  devServer: {
    hot: HOT_RELOAD !== 'false',
    webSocketServer: 'sockjs',
    port: WDS_PORT,
    static: false,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  watchOptions: {
    // needed to prevent ENOSPC: System limit for number of file watchers reached error
    ignored: /node_modules/,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      prettier: false,
      'prettier/parser-yaml': false,
    },
  },
  node: {
    global: true, // see https://github.com/browserify/randombytes/issues/36
  },
  module: {
    rules: [
      {
        // Disable tree shaking on modules shared with Console dynamic plugins
        test: sharedPluginModulesTest,
        sideEffects: true,
      },
      {
        test: path.resolve(__dirname, 'get-local-plugins.js'),
        loader: 'val-loader',
        options: { pluginPackages },
      },
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules\/(?!(bitbucket|ky|ini|@patternfly(-\S+)?)\/)/,
        use: [
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
            loader: 'esbuild-loader',
            options: {
              // Always use the root tsconfig.json. Packages might have a separate tsconfig.json for storybook.
              tsconfig: path.resolve(__dirname, 'tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /\.s?css$/,
        exclude: /node_modules\/(?!(@patternfly(-\S+)?)\/).*/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: './',
            },
          },
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
        include: path.resolve(__dirname, 'node_modules/monaco-editor'),
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[path][name][ext]',
        },
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
      maxInitialRequests: 6,
      maxAsyncRequests: 8,
      cacheGroups: {
        vendors: {
          test: /\/node_modules\//,
          priority: -10,
          enforce: true,
          filename: (pathData) => {
            // give a special name to initial chunk for analyze.sh
            if ((pathData?.chunk as webpack.Chunk)?.isOnlyInitial()) {
              return `vendors~main-chunk-[name]-[contenthash].min.js`;
            }
            return 'vendors~[name]-chunk-[contenthash].min.js';
          },
        },
        'vendor-plugins-shared': {
          test(module: webpack.NormalModule) {
            return (
              module.resource &&
              sharedPluginModulesTest.test(module.resource) &&
              !module.resource.includes('/node_modules/@patternfly')
            );
          },
        },
      },
    },
    runtimeChunk: 'single',
  },
  plugins: [
    new ExtensionValidatorPlugin({ pluginPackages }),
    new webpack.container.ModuleFederationPlugin({
      shared: consoleProvidedSharedModules,
    }),
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
      chunksSortMode: 'auto',
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './public/index.html',
      production: NODE_ENV === 'production',
      chunksSortMode: 'auto',
    }),
    new HtmlWebpackSkipAssetsPlugin(),
    new MonacoWebpackPlugin({
      languages: ['yaml', 'dockerfile', 'json', 'plaintext'],
      globalAPI: true,
      customLanguages: [
        {
          label: 'yaml',
          entry: 'monaco-yaml',
          worker: {
            id: 'monaco-yaml/yamlWorker',
            entry: 'monaco-yaml/yaml.worker',
          },
        },
      ],
    }),
    new NodePolyfillPlugin({
      additionalAliases: ['process'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, './public/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/console-shared/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/console-app/locales'), to: 'locales' },
        {
          from: path.resolve(__dirname, './packages/operator-lifecycle-manager/locales'),
          to: 'locales',
        },
        {
          from: path.resolve(__dirname, './packages/operator-lifecycle-manager-v1/locales'),
          to: 'locales',
        },
        { from: path.resolve(__dirname, './packages/dev-console/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/knative-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/container-security/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/shipwright-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/webterminal-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/topology/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/helm-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/git-service/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/metal3-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/vsphere-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/insights-plugin/locales'), to: 'locales' },
        {
          from: path.resolve(__dirname, './packages/console-telemetry-plugin/locales'),
          to: 'locales',
        },
      ],
    }),
    extractCSS,
    ...(REACT_REFRESH ? [new ReactRefreshWebpackPlugin()] : []),
  ],
  devtool: 'cheap-module-source-map',
  stats: 'minimal',
};

if (CHECK_CYCLES === 'true') {
  new CircularDependencyPreset({
    exclude: /node_modules|public\/dist|\.(gql|html)$/,
    reportFile: '.webpack-cycles',
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
  config.devtool = 'source-map';
  config.output.filename = '[name]-bundle-[chunkhash].min.js';
  config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  // Causes error in --mode=production due to scope hoisting
  config.optimization.concatenateModules = false;
  config.stats = 'normal';
}

export default config;
