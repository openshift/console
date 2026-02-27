/* eslint-env node */
import * as webpack from 'webpack';
import * as path from 'path';
import * as _ from 'lodash';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import * as _crypto from 'crypto';

import { HtmlWebpackSkipAssetsPlugin } from 'html-webpack-skip-assets-plugin';
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

// A workaround fix for the breaking change in Node.js v18 due to the change in hashing algorithm.
// This code change override the default webpack v4 default hashing algorithm -"md4".
// This change can be remove when console UI update webpack to version 5 in the future.
const hash = _crypto.createHash;
Object.assign(_crypto, {
  createHash: (): _crypto.Hash => hash('sha256'),
});

/* Helpers */
const extractCSS = new MiniCssExtractPlugin({
  filename:
    NODE_ENV === 'production'
      ? 'app-bundle.[name].[contenthash].css'
      : 'app-bundle.[name].[hash].css',
  // We follow BEM naming to scope CSS.
  // See https://github.com/webpack-contrib/mini-css-extract-plugin/issues/250
  ignoreOrder: true,
});
const virtualModules = new VirtualModulesPlugin();

const getVendorModuleRegExp = (vendorModules: string[]) =>
  new RegExp(`node_modules\\/(${vendorModules.map(_.escapeRegExp).join('|')})\\/`);

const overpassTest = /overpass-.*\.(woff2?|ttf|eot|otf)(\?.*$|$)/;

const sharedPluginModulesTest = getVendorModuleRegExp(
  // Map shared module names to actual webpack modules as per shared-modules-init.ts
  sharedPluginModules.map((moduleName) => {
    if (moduleName === '@openshift-console/dynamic-plugin-sdk') {
      return '@console/dynamic-plugin-sdk/src/lib-core';
    }

    if (moduleName === '@openshift-console/dynamic-plugin-sdk-internal') {
      return '@console/dynamic-plugin-sdk/src/lib-internal';
    }

    if (moduleName.startsWith('@patternfly/')) {
      return moduleName.replace(/^@patternfly\//, '@patternfly-4/');
    }

    return moduleName;
  }),
);

const config: Configuration = {
  entry: {
    main: ['./public/components/app.jsx', 'monaco-editor/esm/vs/editor/editor.worker.js'],
    'vendor-patternfly-4-shared': './public/vendor-patternfly-4-shared.scss',
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
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
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
        test: sharedPluginModulesTest,
        sideEffects: true,
      },
      {
        test: /\.js$/,
        include: /node_modules\/@patternfly-4\//,
        loader: 'babel-loader',
        options: {
          plugins: [
            [
              'transform-imports',
              {
                // Transform all @patternfly/* imports to @patternfly-4/*
                '@patternfly\\/(\\S*)': {
                  transform: (importName, matches) => `@patternfly-4/${matches[1]}`,
                  skipDefaultConversion: true,
                },
              },
            ],
          ],
        },
      },
      {
        test: /(\.jsx?)|(\.tsx?)$/,
        exclude: /node_modules\/(?!(bitbucket|ky|ini)\/)/,
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
        exclude: /node_modules\/(?!(@patternfly(-\S+)?|@console\/plugin-shared)\/).*/,
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
          name: 'assets/[path][name].[ext]',
          esModule: false,
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
      maxInitialRequests: 6,
      maxAsyncRequests: 8,
      cacheGroups: {
        vendors: {
          test: /\/node_modules\//,
          priority: -10,
          enforce: true,
        },
        'vendor-patternfly-5': {
          // modules with @patternfly/ that don't also have @patternfly-4/ in the string, plus d3-* modules
          test: /^(?!.*@patternfly-4\/)(.*@patternfly\/.*|.*[\\/]node_modules[\\/]d3-.*)/,
        },
        'vendor-patternfly-4-shared': {
          test: /@patternfly-4\//,
        },
        'vendor-plugins-shared': {
          test: ({ resource = '' }) =>
            sharedPluginModulesTest.test(resource) &&
            !resource.includes('/node_modules/@patternfly'),
        },
      },
    },
    runtimeChunk: 'single',
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
      chunksSortMode: 'auto',
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './public/index.html',
      production: NODE_ENV === 'production',
      chunksSortMode: 'auto',
      // exclude:
      // vendor-patternfly-4-shared-chunk-<hash>.min.js (js entry for vendor-patternfly-4-shared.scss)
      // app-bundle.vendor-patternfly-4-shared~main.<hash>.css (PF4 from the shared PF modules - we already share out PF4 css)
      excludeAssets: [
        /vendor-patternfly-4-shared-chunk.*\.js/,
        /vendor-patternfly-4-shared~main.*\.css/,
      ],
    }),
    new HtmlWebpackSkipAssetsPlugin(),
    new MonacoWebpackPlugin({
      languages: ['yaml', 'dockerfile', 'json', 'plaintext'],
      globalAPI: true,
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
        { from: path.resolve(__dirname, './packages/pipelines-plugin/locales'), to: 'locales' },
        {
          from: path.resolve(__dirname, './packages/service-binding-plugin/locales'),
          to: 'locales',
        },
        { from: path.resolve(__dirname, './packages/shipwright-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/webterminal-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/topology/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/helm-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/rhoas-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/git-service/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/gitops-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/metal3-plugin/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/vsphere-plugin/locales'), to: 'locales' },
        {
          from: path.resolve(__dirname, './packages/network-attachment-definition-plugin/locales'),
          to: 'locales',
        },
        { from: path.resolve(__dirname, './packages/patternfly/locales'), to: 'locales' },
        { from: path.resolve(__dirname, './packages/insights-plugin/locales'), to: 'locales' },
        {
          from: path.resolve(__dirname, './packages/local-storage-operator-plugin/locales'),
          to: 'locales',
        },
        {
          from: path.resolve(__dirname, './packages/console-telemetry-plugin/locales'),
          to: 'locales',
        },
      ],
    }),
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
    exclude: /node_modules|public\/dist|\.(gql|html)$/,
    // TODO: investigate how to load the plugins registry asynchronously
    filterModules: /^node_modules\/@console\/active-plugins\.js$/,
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
  config.output.filename = '[name]-bundle-[hash].min.js';
  config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  // Causes error in --mode=production due to scope hoisting
  config.optimization.concatenateModules = false;
  config.stats = 'normal';
}

export default config;
