// Karma configuration
module.exports = function(config) {

  var appBase   = 'src/';       // transpiled app JS files
  var appAssets = '/base/src/'; // component assets fetched by Angular's compiler

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher')
    ],

    // list of files / patterns to load in the browser
    files: [
      // System.js for module loading
      'node_modules/systemjs/dist/system.src.js',

      // Polyfills
      'node_modules/core-js/client/shim.js',

      // Reflect and Zone.js
      'node_modules/reflect-metadata/Reflect.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/zone.js/dist/jasmine-patch.js',
      'node_modules/zone.js/dist/async-test.js',
      'node_modules/zone.js/dist/fake-async-test.js',

      // RxJs.
      { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
      { pattern: 'node_modules/rxjs/**/*.js.map', included: false, watched: false },

      // marked.
      { pattern: 'node_modules/marked/marked.js', included: false, watched: false },

      // FileSaver.
      { pattern: 'node_modules/file-saver/FileSaver.js', included: false, watched: false },

      // Angular 2 itself and the testing library
      {pattern: 'node_modules/@angular/**/*.js', included: false, watched: false},
      {pattern: 'node_modules/@angular/**/*.js.map', included: false, watched: false},

      {pattern: 'systemjs.config.js', included: false, watched: false},
      'karma-test-shim.js',

      // transpiled application & spec code paths loaded via module imports
      {pattern: appBase + '**/*.js', included: false, watched: true},

      // asset (HTML & CSS) paths loaded via Angular's component compiler
      // (these paths need to be rewritten, see proxies section)
      {pattern: appBase + '**/*.html', included: false, watched: true},
      {pattern: appBase + '**/*.css', included: false, watched: true},

      // paths for debugging with source maps in dev tools
      {pattern: appBase + '**/*.ts', included: false, watched: false},
      {pattern: appBase + '**/*.js.map', included: false, watched: false}
    ],

    // proxied base paths for loading assets
    proxies: {
      // required for component assets fetched by Angular's compiler
      "/src/": appAssets
    },

    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
}
