module.exports = function(config) {

  var deps = [
    'public/bower_components/lodash/lodash.js',
    'public/bower_components/angular/angular.js',
    'public/bower_components/angular-route/angular-route.js',
    'public/bower_components/angular-animate/angular-animate.js',
    'public/bower_components/angular-sanitize/angular-sanitize.js',
    'public/bower_components/angular-mocks/angular-mocks.js',
    ];

  var srcFiles = [
    'public/{module,page}/*.js',
    'public/{module,page}/**/*.js',
    'public/dist/templates.js'
  ];

  config.set({

    // Base path, that will be used to resolve files and exclude.
    basePath: __dirname,

    // Test framework to use.
    frameworks: ['jasmine'],

    // List of files/patterns to load in the browser.
    files: deps.concat(srcFiles),

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
    captureTimeout: 6000,

    // Continuous Integration mode.
    // If true, it capture browsers, run tests and exit.
    singleRun: true

  });

};
