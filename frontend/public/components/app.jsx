import React from 'react';
import { render } from 'react-dom';
import Helmet from 'react-helmet';
import { Provider } from 'react-redux';
import { IndexRoute, Redirect, Route, Router } from 'react-router';

import store from '../redux';
import { featureActions } from '../features';
import { analyticsSvc } from '../module/analytics';
import { authSvc } from '../module/auth';
import { k8sBasePath } from '../module/k8s';
import k8sActions from '../module/k8s/k8s-actions';
import { tectonicVersion } from '../module/status';
import { registerNamespaceFriendlyPrefix, actions as UIActions } from '../ui/ui-actions';
import { ClusterOverviewContainer } from './cluster-overview-container';
import { ClusterSettingsPage } from './cluster-settings/cluster-settings';
import { LDAPPage } from './cluster-settings/ldap';
import { ContainersDetailsPage } from './container';
import { CreateYAML } from './create-yaml';
import { ErrorPage, ErrorPage404 } from './error';
import { EventStreamPage } from './events';
import { GlobalNotifications } from './global-notifications';
import { NamespaceSelector } from './namespace';
import { Nav } from './nav';
import { ProfilePage } from './profile';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { BindingsPage, EditRuleContainer } from './RBAC';
import { SearchPage } from './search';
import { history, Loading } from './utils';


const LoadingScreen = () => <div className="loading-screen">
  <div className="loading-screen__logo">
    <img src="static/imgs/tectonic-bycoreos-whitegrn.svg" id="logo" />
  </div>
  <Loading className="loading-screen__loader" />
  <div>Loading your Tectonic Console</div>
</div>;

const App = ({children}) => <div className="co-container">
  <Helmet titleTemplate="%s · Tectonic" />
  {!window.SERVER_FLAGS.authDisabled && !authSvc.isLoggedIn() && <LoadingScreen />}
  <GlobalNotifications />
  <div id="reflex">
    <Nav />
    <div id="content">
      <NamespaceSelector />
      {children}
    </div>
  </div>
</div>;

const onRouteChange = (prevRoute, nextRoute) => {
  if (!window.SERVER_FLAGS.authDisabled && !authSvc.isLoggedIn()) {
    window.location = window.SERVER_FLAGS.loginURL;
    return;
  }
  if (nextRoute) {
    store.dispatch(UIActions.setCurrentLocation(nextRoute.location.pathname, nextRoute.params.ns));
  }
  analyticsSvc.route(window.location.pathname);
};

const init = (nextRoute) => {
  onRouteChange(undefined, nextRoute);

  registerNamespaceFriendlyPrefix('configmaps');
  registerNamespaceFriendlyPrefix('daemonsets');
  registerNamespaceFriendlyPrefix('deployments');
  registerNamespaceFriendlyPrefix('events');
  registerNamespaceFriendlyPrefix('horizontalpodautoscalers');
  registerNamespaceFriendlyPrefix('ingresses');
  registerNamespaceFriendlyPrefix('jobs');
  registerNamespaceFriendlyPrefix('pods');
  registerNamespaceFriendlyPrefix('replicasets');
  registerNamespaceFriendlyPrefix('replicationcontrollers');
  registerNamespaceFriendlyPrefix('rolebindings');
  registerNamespaceFriendlyPrefix('roles');
  registerNamespaceFriendlyPrefix('search');
  registerNamespaceFriendlyPrefix('secrets');
  registerNamespaceFriendlyPrefix('serviceaccounts');
  registerNamespaceFriendlyPrefix('services');

  store.dispatch(k8sActions.getResources());
  store.dispatch(featureActions.detectK8sFlags(k8sBasePath));
  store.dispatch(featureActions.detectCoreosFlags(`${k8sBasePath}/apis/coreos.com/v1`));

  tectonicVersion();
};

render((
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App} onEnter={init} onChange={onRouteChange}>
        <IndexRoute component={ClusterOverviewContainer}/>

        <Route path="rolebindings" component={BindingsPage} />

        <Route path="clusterroles">
          <Route path=":name/add-rule" component={EditRuleContainer} />
          <Route path=":name/:rule/edit" component={EditRuleContainer} />
          <Route path=":name/:view" component={ResourceDetailsPage} kind="clusterroles" />
        </Route>

        {/* We don't have a separate list page for Roles, so redirect to the Role Bindings list */}
        <Redirect from="ns/:ns/roles" to="rolebindings" />

        <Route path="ns/:ns/roles/:name/add-rule" component={EditRuleContainer} />
        <Route path="ns/:ns/roles/:name/:rule/edit" component={EditRuleContainer} />

        <Route path="namespaces">
          <IndexRoute component={ResourceListPage} kind="namespaces" />
          <Route path=":name/:view" component={ResourceDetailsPage} kind="namespaces" />
        </Route>

        <Route path="nodes">
          <IndexRoute component={ResourceListPage} kind="nodes" />
          <Route path=":name/:view" component={ResourceDetailsPage} kind="nodes" />
        </Route>

        <Route path="settings">
          <Route path="profile" component={ProfilePage} />
          <Route path="ldap" component={LDAPPage} />
          <Route path="cluster" component={ClusterSettingsPage} />
        </Route>

        <Route path="all-namespaces/events" component={EventStreamPage} />
        <Route path="ns/:ns/events" component={EventStreamPage} />

        <Route path="all-namespaces/search" component={SearchPage} />
        <Route path="ns/:ns/search" component={SearchPage} />
        <Redirect from="search" to="all-namespaces/search" />

        <Route path="all-namespaces/:kind" component={ResourceListPage} />
        <Route path="ns/:ns/:kind" component={ResourceListPage} />
        <Route path="ns/:ns/:kind/new" component={CreateYAML} />
        <Route path="ns/:ns/:kind/:name/:view" component={ResourceDetailsPage} />
        <Route path="ns/:ns/pods/:podName/:kind/:name/:view" component={ContainersDetailsPage} />

        <Route path="error" component={ErrorPage} />
        <Route path="*" component={ErrorPage404} />
      </Route>
    </Router>
  </Provider>
), document.getElementById('app'));
