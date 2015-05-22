// The main app module.
angular.module('bridge', [
  // angular deps
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  // other deps
  'ui.bootstrap',
  'underscore',
  'jquery',
  'coreos',
  'ngTagsInput',
  // internal modules
  'templates',
  'k8s',
  'bridge.const',
  'bridge.filter',
  'bridge.service',
  'bridge.ui',
  'bridge.page',
  'core.pkg',
])
.config(function($routeProvider, $locationProvider, $httpProvider, configSvcProvider, apiClientProvider,
      errorMessageSvcProvider, flagSvcProvider, k8sConfigProvider) {
  'use strict';

  $locationProvider.html5Mode(true);
  flagSvcProvider.setGlobalId('SERVER_FLAGS');
  k8sConfigProvider.setBasePath('/api/kubernetes/' + window.SERVER_FLAGS.k8sVersion);

  configSvcProvider.config({
    siteBasePath: '/',
    libPath: '/static/lib/coreos-web',
    jsonParse: true,
    detectHost: true,
    detectScheme: true,
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
    .when('/apps', {
      controller: 'AppsCtrl',
      templateUrl: '/static/page/apps/apps.html',
      title: 'Applications',
    })
    .when('/ns/:ns/apps', {
      controller: 'AppsCtrl',
      templateUrl: '/static/page/apps/apps.html',
      title: 'Applications',
    })
    .when('/ns/:ns/apps/new', {
      controller: 'NewAppCtrl',
      templateUrl: '/static/page/apps/new-app.html',
      title: 'Create New Application',
    })
    .when('/events', {
      controller: 'EventsCtrl',
      templateUrl: '/static/page/events/events.html',
      title: 'Events',
    })
    .when('/ns/:ns/events', {
      controller: 'EventsCtrl',
      templateUrl: '/static/page/events/events.html',
      title: 'Events',
    })
    .when('/services', {
      controller: 'ServicesCtrl',
      templateUrl: '/static/page/services/services.html',
      title: 'Services',
    })
    .when('/ns/:ns/services', {
      controller: 'ServicesCtrl',
      templateUrl: '/static/page/services/services.html',
      title: 'Services',
    })
    .when('/ns/:ns/services/new', {
      controller: 'NewServiceCtrl',
      templateUrl: '/static/page/services/new-service.html',
      title: 'Create New Service',
    })
    .when('/ns/:ns/services/:name', {
      controller: 'ServiceCtrl',
      templateUrl: '/static/page/services/service.html',
      title: 'Service',
    })
    .when('/ns/:ns/services/:name/pods', {
      controller: 'ServicePodsCtrl',
      templateUrl: '/static/page/services/pods.html',
      title: 'Service Pods',
    })
    .when('/replicationcontrollers', {
      controller: 'ReplicationcontrollersCtrl',
      templateUrl: '/static/page/replicationcontrollers/replicationcontrollers.html',
      title: 'Replication Controllers',
    })
    .when('/ns/:ns/replicationcontrollers', {
      controller: 'ReplicationcontrollersCtrl',
      templateUrl: '/static/page/replicationcontrollers/replicationcontrollers.html',
      title: 'Replication Controllers',
    })
    .when('/ns/:ns/replicationcontrollers/new', {
      controller: 'NewReplicationcontrollerCtrl',
      templateUrl: '/static/page/replicationcontrollers/new-replicationcontroller.html',
      title: 'New Replication Controller',
    })
    .when('/ns/:ns/replicationcontrollers/:name/edit', {
      controller: 'EditReplicationcontrollerCtrl',
      templateUrl: '/static/page/replicationcontrollers/edit-replicationcontroller.html',
      title: 'Edit Replication Controller',
    })
    .when('/ns/:ns/replicationcontrollers/:name', {
      controller: 'ReplicationcontrollerCtrl',
      templateUrl: '/static/page/replicationcontrollers/replicationcontroller.html',
      title: 'Replication Controller',
    })
    .when('/ns/:ns/replicationcontrollers/:name/pods', {
      controller: 'ReplicationcontrollerPodsCtrl',
      templateUrl: '/static/page/replicationcontrollers/pods.html',
      title: 'Replication Controller Pods',
    })
    .when('/pods', {
      controller: 'PodsCtrl',
      templateUrl: '/static/page/pods/pods.html',
      title: 'Pods',
    })
    .when('/ns/:ns/pods', {
      controller: 'PodsCtrl',
      templateUrl: '/static/page/pods/pods.html',
      title: 'Pods',
    })
    .when('/ns/:ns/pods/new', {
      controller: 'NewPodCtrl',
      templateUrl: '/static/page/pods/new-pod.html',
      title: 'Create New Pod',
    })
    .when('/ns/:ns/pods/:name', {
      controller: 'PodCtrl',
      templateUrl: '/static/page/pods/pod.html',
      title: 'Pod',
    })
    .when('/ns/:ns/pods/:name/events', {
      controller: 'PodSyseventsCtrl',
      templateUrl: '/static/page/pods/sysevents.html',
      title: 'Pod Events',
    })
    .when('/ns/:ns/pods/:podName/containers/:name', {
      controller: 'ContainerCtrl',
      templateUrl: '/static/page/containers/container.html',
      title: 'Container',
    })
    .when('/machines', {
      controller: 'MachinesCtrl',
      templateUrl: '/static/page/machines/machines.html',
      title: 'Machines',
    })
    .when('/machines/:name', {
      controller: 'MachineCtrl',
      templateUrl: '/static/page/machines/machine.html',
      title: 'Machine',
    })
    .when('/machines/:name/events', {
      controller: 'MachineSyseventsCtrl',
      templateUrl: '/static/page/machines/sysevents.html',
      title: 'Machine Events',
    })
    .when('/machines/:name/pods', {
      controller: 'MachinePodsCtrl',
      templateUrl: '/static/page/machines/pods.html',
      title: 'Machine Pods',
    })
    // Alias for machines (for programatic routing).
    .when('/nodes', {
      redirectTo: '/machines',
    })
    .when('/nodes/:name', {
      redirectTo: '/machines/:name',
    })
    .when('/search', {
      controller: 'SearchCtrl',
      templateUrl: '/static/page/search/search.html',
      title: 'Search',
    })
    .when('/settings/registries', {
      controller: 'RegistriesCtrl',
      templateUrl: '/static/page/settings/registries.html',
      title: 'Configure Registries',
      resolve: {
        client: 'ClientLoaderSvc'
      }
    })
    .when('/settings/users', {
      controller: 'UsersCtrl',
      templateUrl: '/static/page/settings/users.html',
      title: 'Users & API Keys',
      resolve: {
        client: 'ClientLoaderSvc'
      }
    })
    .when('/welcome', {
      controller: 'WelcomeCtrl',
      templateUrl: '/static/page/welcome/welcome.html',
      title: 'Welcome to your CoreOS Cluster',
    })
    .otherwise({
      templateUrl: '/static/page/error/404.html',
      title: 'Page Not Found (404)'
    });
})
.run(function($rootScope, CONST, flagSvc, debugSvc, firehose) {
  'use strict';
  // Convenience access for temmplates
  $rootScope.CONST = CONST;
  $rootScope.SERVER_FLAGS = flagSvc.all();
  $rootScope.debug = debugSvc;
  firehose.start();
});
