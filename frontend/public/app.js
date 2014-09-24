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
    'ngTagsInput',
    // internal modules
    'app.ui'
  ]);

  // Routes
  app.config(function($routeProvider, $locationProvider, $httpProvider,
        configSvcProvider, apiClientProvider, errorMessageSvcProvider) {

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
        rootUrl: window.location.origin,
        discoveryEndpoint: window.location.origin + '/api/bridge/v1/discovery/v1/rest'
      }]
    });

    errorMessageSvcProvider.registerFormatter('k8sApi', function(resp) {
      if (resp.data && resp.data.message) {
        return resp.data.message;
      }
      return 'An error occurred. Please try again.';
    });

    $routeProvider
      .when('/', {
        controller: 'ClusterStatusCtrl',
        templateUrl: '/static/page/cluster/status.html',
        title: 'Cluster Status',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/services', {
        controller: 'ServicesCtrl',
        templateUrl: '/static/page/services/services.html',
        title: 'Services',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/services/new', {
        controller: 'NewServiceCtrl',
        templateUrl: '/static/page/services/new-service.html',
        title: 'Create New Service',
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
      .when('/replica-controllers/new', {
        controller: 'NewReplicaControllerCtrl',
        templateUrl: '/static/page/controllers/new-replica-controller.html',
        title: 'New Replication Controller',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/replica-controllers/:id/edit', {
        controller: 'EditReplicaControllerCtrl',
        templateUrl: '/static/page/controllers/edit-replica-controller.html',
        title: 'Edit Replication Controller',
        resolve: {
          client: 'ClientLoaderSvc'
        }
      })
      .when('/replica-controllers/:id', {
        controller: 'ReplicaControllerCtrl',
        templateUrl: '/static/page/controllers/replica-controller.html',
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
      .when('/pods/new', {
        controller: 'NewPodCtrl',
        templateUrl: '/static/page/pods/new-pod.html',
        title: 'Create New Pod',
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
