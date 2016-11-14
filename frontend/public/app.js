// eslint-disable-next-line no-unused-vars
import ngRedux from 'ng-redux';
import { combineReducers } from 'redux';
import thunk from 'redux-thunk';

import {analyticsSvc} from './module/analytics';
import k8sReducers from './module/k8s/k8s-reducers';
import {actions as UIActions} from './ui/ui-actions';
import actions from './module/k8s/k8s-actions';
import UIReducers from './ui/ui-reducers';
import './components/react-wrapper';

// Make moment available via angular DI.
angular.module('moment', []).factory('moment', function($window) {
  return $window.moment;
});

// The main app module.
angular.module('bridge', [
  // angular deps
  'react',
  'ngRoute',
  'ngAnimate',
  'ngSanitize',
  'ngRedux',
  // other deps
  'ui.bootstrap',
  'lodash',
  'jquery',
  'coreos',
  'ngTagsInput',
  // internal modules
  'templates',
  'dex',
  'k8s',
  'bridge.filter',
  'bridge.service',
  'bridge.ui',
  'bridge.page',
  'bridge.react-wrapper',
  'moment',
])
.config(function($compileProvider, $routeProvider, $locationProvider, $httpProvider,
                 configSvcProvider, errorMessageSvcProvider,
                 k8sConfigProvider, activeNamespaceSvcProvider, $ngReduxProvider) {
  'use strict';

  const reducers = combineReducers({
    k8s: k8sReducers,
    UI: UIReducers,
  });

  $ngReduxProvider.createStoreWith(reducers, [thunk]);

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: true
  });

  // deep down in code k8s path is used to open WS connection, which doesn't respect
  // <base> tag in index.html so we cannot use relative path as in many other places
  // and we need to manually prepend it with passed-in base path to form absolute path
  k8sConfigProvider.setKubernetesPath(`${window.SERVER_FLAGS.basePath}api/kubernetes`, window.SERVER_FLAGS.k8sAPIVersion);

  $httpProvider.interceptors.push('unauthorizedInterceptorSvc');
  $httpProvider.interceptors.push('errorInterceptorSvc');
  $httpProvider.defaults.timeout = 5000;

  configSvcProvider.config({
    siteBasePath: window.SERVER_FLAGS.basePath,
    libPath: 'static/lib/coreos-web',
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

  errorMessageSvcProvider.registerFormatter('dexApi', function(resp) {
    if (resp.data && resp.data.error_description) {
      return resp.data.error_description;
    }
    return 'An error occurred. Please try again.';
  });

  function r(route, config) {
    config.resolve = {};
    config.resolve.ensureLoggedIn = 'ensureLoggedInSvc';
    $routeProvider.when(route, config);
  }

  r('/', {
    controller: 'ClusterStatusCtrl',
    templateUrl: '/static/page/cluster/status.html',
    title: 'Cluster Status',
  });

  r('/namespaces', {
    template: '<react-component name="NamespacesPage"></react-component>',
    title: 'Namespaces',
  });

  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('events');
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

  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('services');
  r('/ns/:ns/services/new', {
    controller: 'NewServiceCtrl',
    templateUrl: '/static/page/services/new-service.html',
    title: 'Create New Service',
  });

  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('replicationcontrollers');
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
  r('/ns/:ns/replicationcontrollers/:name/events', {
    controller: 'ReplicationcontrollerSyseventsCtrl',
    templateUrl: '/static/page/replicationcontrollers/replicationcontroller-sysevents.html',
    title: 'Replication Controller Events',
  });

  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('daemonsets');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('jobs');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('horizontalpodautoscalers');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('serviceaccounts');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('configmaps');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('secrets');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('replicasets');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('roles');
  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('rolebindings');
  r('/clusterroles', {
    controller: 'k8sListCtrl',
    templateUrl: '/static/page/k8s-list/k8s-list.html',
    k8sKind: 'clusterroles',
    reloadOnSearch: false,
  });
  r('/clusterrolebindings', {
    controller: 'k8sListCtrl',
    templateUrl: '/static/page/k8s-list/k8s-list.html',
    k8sKind: 'clusterrolebindings',
    reloadOnSearch: false,
  });
  r('/ns/:ns/replicasets/new', {
    controller: 'NewReplicaSetCtrl',
    templateUrl: '/static/page/replicasets/new-replicaset.html',
    title: 'New Replica Set',
  });
  r('/ns/:ns/replicasets/:name/edit', {
    controller: 'EditReplicaSetCtrl',
    templateUrl: '/static/page/replicasets/edit-replicaset.html',
    title: 'Edit Replica Set',
  });

  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('deployments');
  r('/ns/:ns/deployments/new', {
    controller: 'NewDeploymentCtrl',
    templateUrl: '/static/page/deployments/new-deployment.html',
    title: 'New Deployment',
  });
  r('/ns/:ns/deployments/:name/edit', {
    controller: 'EditDeploymentCtrl',
    templateUrl: '/static/page/deployments/edit-deployment.html',
    title: 'Edit Deployment',
  });

  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('pods');
  r('/ns/:ns/pods/new', {
    controller: 'NewPodCtrl',
    templateUrl: '/static/page/pods/new-pod.html',
    title: 'Create New Pod',
  });
  r('/ns/:ns/pods/:name/events', {
    controller: 'PodSyseventsCtrl',
    templateUrl: '/static/page/pods/sysevents.html',
    title: 'Pod Events',
  });
  r('/ns/:ns/pods/:name/logs', {
    controller: 'PodLogsCtrl',
    templateUrl: '/static/page/pods/logs.html',
    title: 'Pod Logs',
  });
  r('/ns/:ns/pods/:name/logs/:containerName', {
    controller: 'PodLogsCtrl',
    templateUrl: '/static/page/pods/logs.html',
    title: 'Pod Logs',
  });
  r('/nodes', {
    controller: 'NodesCtrl',
    templateUrl: '/static/page/nodes/nodes.html',
    title: 'Nodes',
  });
  r('/nodes/:name', {
    controller: 'nodeCtrl',
    templateUrl: '/static/page/nodes/node.html',
    title: 'Node',
  });
  r('/nodes/:name/details', {
    controller: 'nodeCtrl',
    templateUrl: '/static/page/nodes/node.html',
    title: 'Node',
  });
  r('/nodes/:name/events', {
    controller: 'nodeSyseventsCtrl',
    templateUrl: '/static/page/nodes/sysevents.html',
    title: 'Node Events',
  });
  r('/nodes/:name/pods', {
    controller: 'nodePodsCtrl',
    templateUrl: '/static/page/nodes/pods.html',
    title: 'Node Pods',
  });

  activeNamespaceSvcProvider.registerNamespaceFriendlyPrefix('search');

  r('/all-namespaces/search', {
    controller: 'SearchCtrl',
    template: '<react-component name="SearchPage"></react-component>',
    title: 'Search',
  });
  r('/ns/:ns/search', {
    controller: 'SearchCtrl',
    template: '<react-component name="SearchPage"></react-component>',
    title: 'Search',
  });
  r('/search', {
    controller: 'SearchCtrl',
    template: '<react-component name="SearchPage"></react-component>',
    title: 'Search',
    redirect: true,
  });

  r('/settings/registries', {
    controller: 'RegistriesCtrl',
    templateUrl: '/static/page/settings/registries.html',
    title: 'Configure Registries',
  });
  r('/settings/profile', {
    controller: 'ProfileCtrl',
    templateUrl: '/static/page/settings/profile.html',
    title: 'Profile',
  });
  r('/settings/users', {
    controller: 'UsersCtrl',
    templateUrl: '/static/page/settings/users.html',
    title: 'Manage Users',
  });
  r('/settings/cluster', {
    template: '<react-component name="ClusterSettingsPage"></react-component>',
    title: 'Cluster',
  });

  r('/all-namespaces/:kind', {
    controller: 'k8sListCtrl',
    templateUrl: '/static/page/k8s-list/k8s-list.html',
    reloadOnSearch: false,
  });

  r('/ns/:ns/:kind', {
    controller: 'k8sListCtrl',
    templateUrl: '/static/page/k8s-list/k8s-list.html',
    reloadOnSearch: false,
  });

  r('/ns/:ns/roles/:name/add-rule',{
    controller: 'editRulesCtrl',
    templateUrl: '/static/page/rules/rules.html',
  }),

  r('/ns/:ns/roles/:name/:rule/edit', {
    controller: 'editRulesCtrl',
    templateUrl: '/static/page/rules/rules.html',
  }),

  r('/clusterroles/:name/add-rule', {
    controller: 'editRulesCtrl',
    templateUrl: '/static/page/rules/rules.html',
  }),

  r('/clusterroles/:name/:rule/edit', {
    controller: 'editRulesCtrl',
    templateUrl: '/static/page/rules/rules.html',
  });

  r('/ns/:ns/:kind/:name/:view', {
    controller: 'k8sDetailCtrl',
    templateUrl: '/static/page/k8s-detail/k8s-detail.html',
  });
  r('/ns/:ns/pods/:podName/:kind/:name/:view', {
    controller: 'k8sDetailCtrl',
    templateUrl: '/static/page/k8s-detail/k8s-detail.html',
  });

  $routeProvider.when('/error', {
    controller: 'ErrorCtrl',
    templateUrl: '/static/page/error/error.html',
    title: 'Error',
  });

  $routeProvider.otherwise({
    templateUrl: '/static/page/error/404.html',
    title: 'Page Not Found (404)'
  });
})
.run(function(_, $rootScope, $location, $window, $ngRedux, debugSvc, authSvc, k8s, featuresSvc, statusSvc, dex, angularBridge) {
  'use strict';
  $ngRedux.dispatch(UIActions.loadActiveNamespaceFromStorage());

  $rootScope.SERVER_FLAGS = $window.SERVER_FLAGS;
  $ngRedux.dispatch(actions.getResources());
  $rootScope.debug = debugSvc;
  $rootScope.FEATURE_FLAGS = featuresSvc;
  angularBridge.expose();
  k8s.featureDetection();
  dex.featureDetection();
  statusSvc.tectonicVersion();

  $rootScope.logout = e => {
    if (!featuresSvc.isAuthDisabled) {
      authSvc.logout();
    }
    e.preventDefault();
  };

  $rootScope.$on('$routeChangeSuccess', function() {
    analyticsSvc.route(location.pathname);
  });

  $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
    switch(rejection) {
      case 'not-logged-in':
        $window.location.href = $window.SERVER_FLAGS.loginURL;
        break;
    }
  });

  // Completely destroys Angular and reload page if in angular redirect loop.
  // NOTE: this is a big stupid hack to get around an Angular bug wich is triggered by a Chrome bug.
  // see: https://github.com/coreos-inc/bridge/issues/270
  $rootScope.$on('$locationChangeStart', function(e, currURL) {
    if (currURL === `${$window.location.origin}/#`) {
      e.preventDefault();
      $rootScope.$destroy();
      $rootScope.$$watchers = [];
      $rootScope.$$postDigestQueue = [];
      $rootScope.$$asyncQueue = [];
      $rootScope.$$listeners = null;
      $window.location.href = $window.SERVER_FLAGS.basePath;
    }
  });

  $rootScope.$on('xhr-error-unauthorized', function(e, rejection) {
    if (rejection.config && rejection.config.unauthorizedOk) {
      return;
    }

    authSvc.logout($window.location.pathname);
  });

  $rootScope.$on('xhr-error', function(e, rejection) {
    analyticsSvc.error(`${rejection.data}: ${rejection.config.method} ${rejection.config.url}`);
  });

  window.onerror = function (message, source, lineno, colno) {
    try {
      var e = `${message} ${source} ${lineno} ${colno}`;
      analyticsSvc.error(e);
    }
    catch(err) {
      try {
        // eslint-disable-next-line no-console
        console.error(err);
      }
      catch (ignored) {
        // ignore
      }
    }
  };
});
