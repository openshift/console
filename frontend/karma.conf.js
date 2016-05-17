module.exports = function(config) {

  config.set({

    // Base path, that will be used to resolve files and exclude.
    basePath: __dirname,

    // Test framework to use.
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // Deps
      'public/lib/deps.js',
      'public/lib/coreos-web/coreos.js',

      // Deps for tests
      'public/bower_components/angular-mocks/angular-mocks.js',

      // Actual code & tests.
      'public/*_test.js',
      'public/**/*_test.js',

      // compiled templates
      'public/dist/templates*.js',

      'public/dist/app-bundle.js'
    ],

    reporters: ['progress'],

    // web server port
    port: 8100,

    // cli runner port
    runnerPort: 9100,

    colors: true,

    // LOG_DISABLE, LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG
    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ['Chrome'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 5000,

    // Continuous Integration mode.
    // If true, it capture browsers, run tests and exit.
    singleRun: true

  });

};
