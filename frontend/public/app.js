// eslint-disable-next-line no-unused-vars
import ngRedux from 'ng-redux';
import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import thunk from 'redux-thunk';

import {analyticsSvc} from './module/analytics';
import {tectonicVersion} from './module/status';
import {k8sBasePath} from './module/k8s';
import k8sReducers from './module/k8s/k8s-reducers';
import {actions as UIActions, registerNamespaceFriendlyPrefix} from './ui/ui-actions';
import actions from './module/k8s/k8s-actions';
import UIReducers from './ui/ui-reducers';
import { featureReducers, featureReducerName, featureActions } from './features';
import './components/react-wrapper';

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
  'bridge.service',
  'bridge.page',
  'bridge.react-wrapper',
])
.config(function($compileProvider, $routeProvider, $locationProvider,
                 errorMessageSvcProvider, $ngReduxProvider) {
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

  errorMessageSvcProvider.registerFormatter('k8sApi', function(error) {
    return error.message || 'An error occurred. Please try again.';
  });

  function r(route, config) {
    config.resolve = {};
    config.resolve.ensureLoggedIn = 'ensureLoggedInSvc';
    $routeProvider.when(route, config);
  }

  registerNamespaceFriendlyPrefix('events');
  r('/all-namespaces/events', {
    template: '<react-component name="EventStreamPage"></react-component>',
    title: 'Events',
  });
  r('/ns/:ns/events', {
    template: '<react-component name="EventStreamPage"></react-component>',
    title: 'Events',
  });

  registerNamespaceFriendlyPrefix('services');
  registerNamespaceFriendlyPrefix('replicationcontrollers');
  r('/ns/:ns/replicationcontrollers/:name/events', {
    template: '<react-component name="EventStreamReplicationController"></react-component>',
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
    template: '<react-component name="ClusterRolesPage" />',
    title: 'Cluster Roles',
    reloadOnSearch: false,
  });
  r('/clusterrolebindings', {
    template: '<react-component name="ClusterRoleBindingsPage" />',
    title: 'Cluster Role Bindings',
    reloadOnSearch: false,
  });

  registerNamespaceFriendlyPrefix('deployments');

  registerNamespaceFriendlyPrefix('pods');
  r('/ns/:ns/:kind/new', {
    template: '<react-component name="CreateYAML"></react-component>',
    title: 'Create New',
  });
  r('/ns/:ns/pods/:name/events', {
    template: '<react-component name="EventStreamPod"></react-component>',
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
    template: '<react-component name="EventStreamNode"></react-component>',
    title: 'Node Events',
  });
  r('/nodes/:name/pods', {
    template: '<react-component name="NodePodsPage"></react-component>',
    title: 'Node Pods',
  });

  registerNamespaceFriendlyPrefix('search');

  r('/all-namespaces/search', {
    template: '<react-component name="SearchPage"></react-component>',
    title: 'Search',
  });
  r('/ns/:ns/search', {
    template: '<react-component name="SearchPage"></react-component>',
    title: 'Search',
  });
  r('/search', {
    redirectTo: '/all-namespaces/search',
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
    template: '<react-component name="ResourceListPage" />',
    reloadOnSearch: false,
  });

  r('/ns/:ns/:kind', {
    template: '<react-component name="ResourceListPage" />',
    reloadOnSearch: false,
  });

  r('/ns/:ns/roles/:name/add-rule',{
    template: '<react-component name="EditRuleContainer" />'
  }),

  r('/ns/:ns/roles/:name/:rule/edit', {
    template: '<react-component name="EditRuleContainer" />'
  }),

  r('/clusterroles/:name/add-rule', {
    template: '<react-component name="EditRuleContainer" />'
  }),

  r('/clusterroles/:name/:rule/edit', {
    template: '<react-component name="EditRuleContainer" />'
  });

  r('/ns/:ns/:kind/:name/:view', {
    template: '<react-component name="ResourceDetailsPage" />',
  });
  r('/ns/:ns/pods/:podName/:kind/:name/:view', {
    template: '<react-component name="ResourceDetailsPage" />',
  });

  $routeProvider.otherwise({
    template: '<react-component name="AppRouter"></react-component>',
  });
})
.run(function($rootScope, $window, $ngRedux, angularBridge) {
  'use strict';

  $ngRedux.dispatch(actions.getResources());
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
