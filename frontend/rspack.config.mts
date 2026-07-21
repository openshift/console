import { WebpackSharedConfig, WebpackSharedObject } from '@openshift/dynamic-plugin-sdk-webpack';
import {
  CopyRspackPlugin,
  CssExtractRspackPlugin,
  LightningCssMinimizerRspackPlugin,
  SwcJsMinimizerRspackPlugin,
  NormalModuleReplacementPlugin,
  Configuration,
  NormalModule,
  ProgressPlugin,
  sharing,
} from '@rspack/core';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import * as _ from 'lodash';
import * as path from 'path';
import * as semver from 'semver';

import {
  getSharedModuleMetadata,
  sharedPluginModules,
} from '@console/dynamic-plugin-sdk/src/shared-modules/shared-modules-meta';
import {
  dynamicModuleImportTransformFilter,
  dynamicModulePackageSpecs,
} from '@console/dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin';
import {
  DynamicModuleImportPlugin,
  resolveDynamicModuleMaps,
} from '@console/dynamic-plugin-sdk/src/webpack/DynamicModuleImportPlugin';
import { ExtensionValidatorPlugin } from '@console/dynamic-plugin-sdk/src/webpack/ExtensionValidatorPlugin';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';
import { CircularDependencyPreset } from './webpack.circular-deps';

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const NODE_ENV = process.env.NODE_ENV || 'development';
const HOT_RELOAD = process.env.HOT_RELOAD || 'true';
const CHECK_CYCLES = process.env.CHECK_CYCLES || 'false';
const ANALYZE_BUNDLE = process.env.ANALYZE_BUNDLE || 'false';
const REACT_REFRESH = process.env.REACT_REFRESH === 'true';
const WDS_PORT = 8080;

/* Helpers */
const pluginPackages = resolvePluginPackages();

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

const dynamicModuleMaps = resolveDynamicModuleMaps(dynamicModulePackageSpecs, [
  path.resolve(__dirname, 'node_modules'),
]);

/**
 * Get webpack shared module configuration to use by Console application.
 *
 * This includes Console provided {@link sharedPluginModules} and shared dynamic modules
 * resolved from {@link dynamicModulePackageSpecs}.
 *
 * Note: shared modules contributed by Console application should be marked with `eager: true`
 * to ensure these modules are part of the initial chunk.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
const getWebpackSharedModules = () => {
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

  const sharedDynamicModules = Object.entries(dynamicModuleMaps).reduce<WebpackSharedObject>(
    (acc, [moduleName, dynamicModuleMap]) => {
      const moduleConfig: WebpackSharedConfig = { eager: true };

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const moduleVersion = require(`${moduleName}/package.json`).version;

      if (semver.valid(moduleVersion)) {
        moduleConfig.version = moduleVersion;
      }

      Object.values(dynamicModuleMap).forEach((request) => {
        acc[`${moduleName}/${request}`] = moduleConfig;
      });

      return acc;
    },
    {},
  );

  return { ...consoleProvidedSharedModules, ...sharedDynamicModules };
};

const config: Configuration = {
  entry: {
    main: ['./public/components/app.tsx'],
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: 'static/',
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-[chunkhash].js',
  },
  performance: {
    // The maximum size in MiB of the entrypoint and generated files permitted by analyze.sh
    maxEntrypointSize: 8.6 * 1048576,
    maxAssetSize: 3.8 * 1048576, // the size of the monaco-editor chunk
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
  watchOptions: {
    ignored: /node_modules/, // needed to prevent ENOSPC: System limit for number of file watchers reached error
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      prettier: false,
      'prettier/parser-yaml': false,
      '@patternfly/react-styles/css/': false, // vendor.scss already imports all PatternFly styles via SCSS
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
        type: 'javascript/auto',
        use: {
          loader: 'builtin:swc-loader',
          options: {
            detectSyntax: 'auto',
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                jsx: true
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: REACT_REFRESH,
                  refresh: REACT_REFRESH,
                }
              },
              target: 'es2021',
            },
            sourceMaps: true,
            minify: false,
          },
        },
      },
      {
        test: /\.s?css$/,
        exclude: /node_modules\/(?!(@patternfly(-\S+)?)\/).*/,
        use: [
          {
            loader: CssExtractRspackPlugin.loader,
            options: {
              publicPath: './',
            },
          },
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
          filename: 'vendors~[name]-chunk-[contenthash].min.js',
        },
        'vendor-plugins-shared': {
          test(module: NormalModule) {
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
    minimizer: [
      new SwcJsMinimizerRspackPlugin(),
      new LightningCssMinimizerRspackPlugin({
        minimizerOptions: {
          targets: 'last 10 versions, not dead',
        },
      }),
    ],
  },
  plugins: [
    new ExtensionValidatorPlugin({ pluginPackages }),
    new DynamicModuleImportPlugin({
      loader:
        '@console/dynamic-plugin-sdk/dist/webpack/lib/webpack/loaders/dynamic-module-import-loader',
      dynamicModuleMaps,
      moduleFilter: dynamicModuleImportTransformFilter,
    }),
    new sharing.SharePlugin({
      shared: getWebpackSharedModules(),
      enhanced: false // retains webpack 5 SharePlugin behavior as opposed to MF 2.0
    }),
    new NormalModuleReplacementPlugin(/^lodash$/, 'lodash-es'),
    new TsCheckerRspackPlugin({
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
    new CopyRspackPlugin({
      patterns: [
        { from: path.resolve(__dirname, './public/robots.txt'), to: 'robots.txt' },
        {
          from: 'packages/*/locales/**/*.json',
          to: ({ absoluteFilename }) => {
            const segments = absoluteFilename.split(path.sep);
            return segments.slice(segments.lastIndexOf('locales')).join(path.sep);
          },
          context: path.resolve(__dirname),
        },
        {
          from: 'public/locales/**/*.json',
          to: ({ absoluteFilename }) => {
            const segments = absoluteFilename.split(path.sep);
            return segments.slice(segments.lastIndexOf('locales')).join(path.sep);
          },
          context: path.resolve(__dirname),
        },
        { from: 'public/imgs', to: 'imgs' },
        { from: 'public/load-test.sw.js', to: 'load-test.sw.js' },
      ],
    }),
    new CssExtractRspackPlugin({
      filename: 'app-bundle.[name].[contenthash].css',
      // We follow BEM naming to scope CSS.
      // See https://github.com/webpack-contrib/mini-css-extract-plugin/issues/250
      ignoreOrder: true,
    }),
    ...(REACT_REFRESH ? [new ReactRefreshRspackPlugin()] : [new ProgressPlugin()]),
  ],
  devtool: 'cheap-module-source-map',
  stats: 'minimal',
  lazyCompilation: false, // ExtensionValidatorPlugin does not work with this setting enabled
};

if (CHECK_CYCLES === 'true') {
  new CircularDependencyPreset({
    exclude: /node_modules|public\/dist|\.html$/,
    reportFile: '.webpack-cycles',
  }).apply(config.plugins);
}

if (ANALYZE_BUNDLE === 'true') {
  config.plugins.push(
    new RsdoctorRspackPlugin({
      features: {
        loader: false // doesn't work: "Load data failed, please try again"
      },
      output: {
        mode: 'brief',
        options: {
          type: ['html'],
          htmlOptions: {
            writeDataJson: false,
            reportHtmlName: 'report.html',
          },
        },
      },
      // Don't open report in default browser automatically
      disableClientServer: true,
    }),
  );

  // Only fail the build due to excess bundle size if running analyze.sh
  // This way, the other tests (frontend, e2e) can still provide feedback in CI
  if (config.performance) {
    config.performance.hints = 'error';
  }
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
