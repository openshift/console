// eslint-disable-next-line no-unused-vars
import ngRedux from 'ng-redux';
import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import thunk from 'redux-thunk';

import {analyticsSvc} from './module/analytics';
import {tectonicVersion} from './module/status';
import {k8sBasePath} from './module/k8s/k8s';
import k8sReducers from './module/k8s/k8s-reducers';
import {actions as UIActions, registerNamespaceFriendlyPrefix} from './ui/ui-actions';
import actions from './module/k8s/k8s-actions';
import UIReducers from './ui/ui-reducers';
import { featureReducers, featureReducerName, featureActions } from './features';
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
  'k8s',
  'bridge.service',
  'bridge.ui',
  'bridge.page',
  'bridge.react-wrapper',
  'moment',
])
.config(function($compileProvider, $routeProvider, $locationProvider,
                 configSvcProvider, errorMessageSvcProvider, $ngReduxProvider) {
  'use strict';

  const reducers = combineReducers({
    k8s: k8sReducers,
    UI: UIReducers,
    form: formReducer,
    [featureReducerName]: featureReducers,
  });

  $ngReduxProvider.createStoreWith(reducers, [thunk]);

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: true
  });

  configSvcProvider.config({
    siteBasePath: window.SERVER_FLAGS.basePath,
    libPath: 'static/lib/coreos-web',
    jsonParse: true,
    detectHost: true,
    detectScheme: true,
  });

  errorMessageSvcProvider.registerFormatter('k8sApi', function(error) {
    return error.message || 'An error occurred. Please try again.';
  });

  function r(route, config) {
    config.resolve = {};
    config.resolve.ensureLoggedIn = 'ensureLoggedInSvc';
    $routeProvider.when(route, config);
  }

  r('/', {
    template: '<react-component name="ClusterOverviewContainer"></react-component>',
    title: 'Cluster Status',
  });

  r('/namespaces', {
    template: '<react-component name="NamespacesPage"></react-component>',
    title: 'Namespaces',
  });

  registerNamespaceFriendlyPrefix('events');
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

  registerNamespaceFriendlyPrefix('services');
  r('/ns/:ns/services/new', {
    controller: 'NewServiceCtrl',
    templateUrl: '/static/page/services/new-service.html',
    title: 'Create New Service',
  });

  registerNamespaceFriendlyPrefix('replicationcontrollers');
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

  registerNamespaceFriendlyPrefix('daemonsets');
  registerNamespaceFriendlyPrefix('jobs');
  registerNamespaceFriendlyPrefix('horizontalpodautoscalers');
  registerNamespaceFriendlyPrefix('serviceaccounts');
  registerNamespaceFriendlyPrefix('configmaps');
  registerNamespaceFriendlyPrefix('secrets');
  registerNamespaceFriendlyPrefix('replicasets');
  registerNamespaceFriendlyPrefix('roles');
  registerNamespaceFriendlyPrefix('rolebindings');
  registerNamespaceFriendlyPrefix('ingresses');

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

  registerNamespaceFriendlyPrefix('deployments');
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

  registerNamespaceFriendlyPrefix('pods');
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
  r('/nodes', {
    template: '<react-component name="NodesPage"></react-component>',
    title: 'Nodes',
  });
  r('/nodes/:name/details', {
    template: '<react-component name="NodeDetailsPage"></react-component>',
    title: 'Node',
  });
  r('/nodes/:name/yaml', {
    template: '<react-component name="NodeDetailsPage"></react-component>',
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

  registerNamespaceFriendlyPrefix('search');

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

  r('/settings/profile', {
    template: '<react-component name="ProfilePage"></react-component>',
    title: 'Profile',
  });
  r('/settings/ldap', {
    template: '<react-component name="LDAPPage"></react-component>',
    title: 'LDAP',
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
    template: '<react-component name="ErrorPage"></react-component>',
    title: 'Error',
  });

  $routeProvider.otherwise({
    template: '<react-component name="ErrorPage404"></react-component>',
    title: 'Page Not Found (404)'
  });
})
.run(function(_, $rootScope, $location, $window, $ngRedux, debugSvc, angularBridge) {
  'use strict';

  $ngRedux.dispatch(actions.getResources());
  $rootScope.debug = debugSvc;
  angularBridge.expose();

  $ngRedux.dispatch(featureActions.detectK8sFlags(k8sBasePath));
  $ngRedux.dispatch(featureActions.detectCoreosFlags(`${k8sBasePath}/apis/coreos.com/v1`));

  tectonicVersion();

  $rootScope.$on('$routeChangeSuccess', function() {
    $ngRedux.dispatch(UIActions.setCurrentLocation());
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
