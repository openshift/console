(function () {
  'use strict';

  var app;

  angular.module('underscore', []).factory('_', function($window) {
    return $window._;
  });

  angular.module('jquery', []).factory('$', function($window) {
    return $window.$;
  });

  angular.module('app.ui', []);

  // The main app module.
  app = angular.module('app', [
    // angular deps
    'ngRoute',
    'ngAnimate',
    'ngSanitize',
    // other deps
    'ui.bootstrap',
    'templates',
    'underscore',
    'jquery',
    // internal modules
    'app.ui'
  ]);

  // Routes
  app.config(function($routeProvider, $locationProvider, $httpProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider
      .when('/', {
        controller: 'MainCtrl',
        templateUrl: '/static/page/main/main.html',
        title: 'Main'
      })
      .otherwise({
        templateUrl: '/static/page/error/404.html',
        title: 'Page Not Found (404)'
      });

  })
  .run(function(CONST) {
  });

}());
