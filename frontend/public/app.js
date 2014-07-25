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
    'coreos',
    // internal modules
    'app.ui'
  ]);

  // Routes
  app.config(function($routeProvider, $locationProvider, $httpProvider,
        configSvcProvider, apiClientProvider) {

    $locationProvider.html5Mode(true);

    configSvcProvider.config({
      siteBasePath: '/',
      libPath: '/static/lib/coreos-web'
    });

    apiClientProvider.settings({
      cache: false,
      apis: [{
        name: 'bridge',
        id: 'bridge:v1',
        discoveryEndpoint: window.location.origin + '/api/bridge/v1/discovery/v1/rest'
      }]
    });

    $routeProvider
      .when('/', {
        controller: 'MainCtrl',
        templateUrl: '/static/page/main/main.html',
        title: 'Main'
      })
      .when('/deployments', {
        controller: 'DeploymentsCtrl',
        templateUrl: '/static/page/deployments/deployments.html',
        title: 'Deployments',
        resolve: {
          client: 'apiClientLoaderSvc'
        }
      })
      .otherwise({
        templateUrl: '/static/page/error/404.html',
        title: 'Page Not Found (404)'
      });

  })
  .run(function(CONST) {
  });

}());
