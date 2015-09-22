// The main app module.
angular.module('bridge', [
  // angular deps
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ngCookies',
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
.config(function($routeProvider, $locationProvider, $httpProvider, configSvcProvider,
      errorMessageSvcProvider, flagSvcProvider, k8sConfigProvider) {
  'use strict';

  $locationProvider.html5Mode(true);
  flagSvcProvider.setGlobalId('SERVER_FLAGS');
  k8sConfigProvider.setKubernetesPath('/api/kubernetes/', window.SERVER_FLAGS.k8sVersion);
  $httpProvider.interceptors.push('unauthorizedInterceptorSvc');

  configSvcProvider.config({
    siteBasePath: '/',
    libPath: '/static/lib/coreos-web',
    jsonParse: true,
    detectHost: true,
    detectScheme: true,
  });

  errorMessageSvcProvider.registerFormatter('k8sApi', function(resp) {
    if (resp.data && resp.data.message) {
      return resp.data.message;
    }
    return 'An error occurred. Please try again.';
  });

  function r(route, config, unprotected) {
    if (!unprotected) {
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.ensureLoggedIn = 'ensureLoggedInSvc';
    }
    $routeProvider.when(route, config);
  }

  r('/', {
    controller: 'ClusterStatusCtrl',
    templateUrl: '/static/page/cluster/status.html',
    title: 'Cluster Status',
  });
  r('/apps', {
    controller: 'AppsCtrl',
    templateUrl: '/static/page/apps/apps.html',
    title: 'Applications',
    namespaceRedirect: true,
  });
  r('/all-namespaces/apps', {
    controller: 'AppsCtrl',
    templateUrl: '/static/page/apps/apps.html',
    title: 'Applications',
  });
  r('/ns/:ns/apps', {
    controller: 'AppsCtrl',
    templateUrl: '/static/page/apps/apps.html',
    title: 'Applications',
  });
  r('/ns/:ns/apps/new', {
    controller: 'NewAppCtrl',
    templateUrl: '/static/page/apps/new-app.html',
    title: 'Create New Application',
  });
  r('/events', {
    controller: 'EventsCtrl',
    templateUrl: '/static/page/events/events.html',
    title: 'Events',
    namespaceRedirect: true,
  });
  r('/all-namespaces/events', {
    controller: 'EventsCtrl',
    templateUrl: '/static/page/events/events.html',
    title: 'Events',
  });
  r('/ns/:ns/events', {
    controller: 'EventsCtrl',
    templateUrl: '/static/page/events/events.html',
    title: 'Events',
  });
  r('/services', {
    controller: 'ServicesCtrl',
    templateUrl: '/static/page/services/services.html',
    title: 'Services',
    namespaceRedirect: true,
  });
  r('/all-namespaces/services', {
    controller: 'ServicesCtrl',
    templateUrl: '/static/page/services/services.html',
    title: 'Services',
  });
  r('/ns/:ns/services', {
    controller: 'ServicesCtrl',
    templateUrl: '/static/page/services/services.html',
    title: 'Services',
  });
  r('/ns/:ns/services/new', {
    controller: 'NewServiceCtrl',
    templateUrl: '/static/page/services/new-service.html',
    title: 'Create New Service',
  });
  r('/ns/:ns/services/:name', {
    controller: 'ServiceCtrl',
    templateUrl: '/static/page/services/service.html',
    title: 'Service',
  });
  r('/ns/:ns/services/:name/pods', {
    controller: 'ServicePodsCtrl',
    templateUrl: '/static/page/services/pods.html',
    title: 'Service Pods',
  });
  r('/replicationcontrollers', {
    controller: 'ReplicationcontrollersCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontrollers.html',
    title: 'Replication Controllers',
    namespaceRedirect: true,
  });
  r('/all-namespaces/replicationcontrollers', {
    controller: 'ReplicationcontrollersCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontrollers.html',
    title: 'Replication Controllers',
  });
  r('/ns/:ns/replicationcontrollers', {
    controller: 'ReplicationcontrollersCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontrollers.html',
    title: 'Replication Controllers',
  });
  r('/ns/:ns/replicationcontrollers/new', {
    controller: 'NewReplicationcontrollerCtrl',
    templateUrl: '/static/page/replicationcontrollers/new-replicationcontroller.html',
    title: 'New Replication Controller',
  });
  r('/ns/:ns/replicationcontrollers/:name/edit', {
    controller: 'EditReplicationcontrollerCtrl',
    templateUrl: '/static/page/replicationcontrollers/edit-replicationcontroller.html',
    title: 'Edit Replication Controller',
  });
  r('/ns/:ns/replicationcontrollers/:name', {
    controller: 'ReplicationcontrollerCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontroller.html',
    title: 'Replication Controller',
  });
  r('/ns/:ns/replicationcontrollers/:name/pods', {
    controller: 'ReplicationcontrollerPodsCtrl',
    templateUrl: '/static/page/replicationcontrollers/pods.html',
    title: 'Replication Controller Pods',
  });
  r('/pods', {
    controller: 'PodsCtrl',
    templateUrl: '/static/page/pods/pods.html',
    title: 'Pods',
    namespaceRedirect: true,
  });
  r('/all-namespaces/pods', {
    controller: 'PodsCtrl',
    templateUrl: '/static/page/pods/pods.html',
    title: 'Pods',
  });
  r('/ns/:ns/pods', {
    controller: 'PodsCtrl',
    templateUrl: '/static/page/pods/pods.html',
    title: 'Pods',
  });
  r('/ns/:ns/pods/new', {
    controller: 'NewPodCtrl',
    templateUrl: '/static/page/pods/new-pod.html',
    title: 'Create New Pod',
  });
  r('/ns/:ns/pods/:name', {
    controller: 'PodCtrl',
    templateUrl: '/static/page/pods/pod.html',
    title: 'Pod',
  });
  r('/ns/:ns/pods/:name/events', {
    controller: 'PodSyseventsCtrl',
    templateUrl: '/static/page/pods/sysevents.html',
    title: 'Pod Events',
  });
  r('/ns/:ns/pods/:podName/containers/:name', {
    controller: 'ContainerCtrl',
    templateUrl: '/static/page/containers/container.html',
    title: 'Container',
  });
  r('/machines', {
    controller: 'MachinesCtrl',
    templateUrl: '/static/page/machines/machines.html',
    title: 'Machines',
  });
  r('/machines/:name', {
    controller: 'MachineCtrl',
    templateUrl: '/static/page/machines/machine.html',
    title: 'Machine',
  });
  r('/machines/:name/events', {
    controller: 'MachineSyseventsCtrl',
    templateUrl: '/static/page/machines/sysevents.html',
    title: 'Machine Events',
  });
  r('/machines/:name/pods', {
    controller: 'MachinePodsCtrl',
    templateUrl: '/static/page/machines/pods.html',
    title: 'Machine Pods',
  });
  // Alias for machines (for programatic routing).
  r('/nodes', {
    redirectTo: '/machines',
  });
  r('/nodes/:name', {
    redirectTo: '/machines/:name',
  });
  r('/search', {
    controller: 'SearchCtrl',
    templateUrl: '/static/page/search/search.html',
    title: 'Search',
  });
  r('/settings/registries', {
    controller: 'RegistriesCtrl',
    templateUrl: '/static/page/settings/registries.html',
    title: 'Configure Registries',
  });
  r('/settings/users', {
    controller: 'UsersCtrl',
    templateUrl: '/static/page/settings/users.html',
    title: 'Users & API Keys',
  });
  r('/welcome', {
    controller: 'WelcomeCtrl',
    templateUrl: '/static/page/welcome/welcome.html',
    title: 'Welcome to your CoreOS Cluster',
  });
  r('/error', {
    controller: 'ErrorCtrl',
    templateUrl: '/static/page/error/error.html',
    title: 'Error',
  }, true);

  $routeProvider.otherwise({
    templateUrl: '/static/page/error/404.html',
    title: 'Page Not Found (404)'
  });
})
.run(function(_, $rootScope, $location, $window, CONST, flagSvc, debugSvc, firehose, authSvc, k8s) {
  'use strict';
  // Convenience access for temmplates
  $rootScope.CONST = CONST;
  $rootScope.SERVER_FLAGS = flagSvc.all();
  $rootScope.debug = debugSvc;
  firehose.start();

  $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
    switch(rejection) {
      case 'not-logged-in':
        $window.location.href = '/auth/login';
        break;
    }
  });

  // Completely destroys Angular and reload page if in angular redirect loop.
  // NOTE: this is a big stupid hack to get around an Angular bug wich is triggered by a Chrome bug.
  // see: https://github.com/coreos-inc/bridge/issues/270
  $rootScope.$on('$locationChangeStart', function(e, currURL) {
    if (currURL === $window.location.origin + '/#') {
      e.preventDefault();
      $rootScope.$destroy();
      $rootScope.$$watchers = [];
      $rootScope.$$postDigestQueue = [];
      $rootScope.$$asyncQueue = [];
      $rootScope.$$listeners = null;
      $window.location.href = '/';
    }
  });

  $rootScope.$on('xhr-error-unauthorized', function(e, rejection) {
    if (rejection && rejection.status === 401) {
      authSvc.logout($window.location.pathname);
    }
  });

  $rootScope.$on('$routeChangeStart', function(e, next) {
    if (_.isUndefined(next)) {
      return;
    }

    var nextPath = next.originalPath,
        shouldRedirect = next.namespaceRedirect,
        namespacedRoute;

    if (shouldRedirect) {
      // Cancel the route change.
      e.preventDefault();

      // Fix 'back' button behavior.
      //
      // This method (https://docs.angularjs.org/api/ng/service/$location#replace) will
      // replace the current entry in the history stack. This allows us to preserve the
      // correct functionality of the back button when doing these redirects.
      $location.replace();

      namespacedRoute = k8s.namespaces.formatNamespaceRoute(nextPath);

      // Re-route to namespaced route.
      $location.path(namespacedRoute);
    }
  });

});
