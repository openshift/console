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
        title: 'CoreOS'
      })
      .when('/services', {
        controller: 'ServicesCtrl',
        templateUrl: '/static/page/services/services.html',
        title: 'Services',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/services/:id', {
        controller: 'ServiceCtrl',
        templateUrl: '/static/page/services/service.html',
        title: 'Service',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/controllers', {
        controller: 'ControllersCtrl',
        templateUrl: '/static/page/controllers/controllers.html',
        title: 'Controllers',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/controllers/:id', {
        controller: 'ControllerCtrl',
        templateUrl: '/static/page/controllers/controller.html',
        title: 'Controller',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/pods', {
        controller: 'PodsCtrl',
        templateUrl: '/static/page/pods/pods.html',
        title: 'Pods',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/pods/:id', {
        controller: 'PodCtrl',
        templateUrl: '/static/page/pods/pod.html',
        title: 'Pod',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/containers/:podId/:name', {
        controller: 'ContainerCtrl',
        templateUrl: '/static/page/containers/container.html',
        title: 'Container',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/machines', {
        controller: 'MachinesCtrl',
        templateUrl: '/static/page/machines/machines.html',
        title: 'Machines',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/search', {
        controller: 'SearchCtrl',
        templateUrl: '/static/page/search/search.html',
        title: 'Search',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .otherwise({
        templateUrl: '/static/page/error/404.html',
        title: 'Page Not Found (404)'
      });

  })
  .run(function($rootScope, CONST) {
    $rootScope.CONST = CONST;
  });

}());
