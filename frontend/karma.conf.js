module.exports = function(config) {

  config.set({

    // Base path, that will be used to resolve files and exclude.
    basePath: __dirname,

    // Test framework to use.
    frameworks: ['jasmine', 'es6-shim'],

    // list of files / patterns to load in the browser
    files: [
      // Deps
      'public/dist/deps.js',
      // Deps for tests

      'public/components/_test.js',
      'public/dist/app-bundle.js',
      'node_modules/angular-mocks/angular-mocks.js',
      // Actual code & tests.
      'public/*_test.js',
      'public/**/*_test.js',
    ],

    reporters: ['dots'],

    // web server port
    port: 8100,

    // cli runner port
    runnerPort: 9100,

    colors: true,

    // LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ['PhantomJS'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 5000,
  });

};
