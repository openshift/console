import React from 'react';
import { render } from 'react-dom';
import Helmet from 'react-helmet';
import { Provider } from 'react-redux';
import { IndexRoute, Redirect, Route, Router } from 'react-router';

import '../globals';

import store from '../redux';
import { featureActions } from '../features';
import { analyticsSvc } from '../module/analytics';
import { authSvc } from '../module/auth';
import { k8sBasePath } from '../module/k8s';
import k8sActions from '../module/k8s/k8s-actions';
import { tectonicVersion } from '../module/status';
import { registerNamespaceFriendlyPrefix, UIActions } from '../ui/ui-actions';
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
import { BindingsForRolePage, CopyRoleBinding, CreateRoleBinding, EditRoleBinding, EditRulePage } from './RBAC';
import { SearchPage } from './search';
import { history, Loading } from './utils';
import { Clusters } from './federation/cluster';

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


registerNamespaceFriendlyPrefix('configmaps');
registerNamespaceFriendlyPrefix('daemonsets');
registerNamespaceFriendlyPrefix('deployments');
registerNamespaceFriendlyPrefix('events');
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
registerNamespaceFriendlyPrefix('etcdclusters');
registerNamespaceFriendlyPrefix('networkpolicies');
registerNamespaceFriendlyPrefix('prometheuses');

store.dispatch(k8sActions.getResources());
store.dispatch(featureActions.detectK8sFlags(k8sBasePath));
store.dispatch(featureActions.detectCoreosFlags(`${k8sBasePath}/apis/coreos.com/v1`));
store.dispatch(featureActions.detectEtcdOperatorFlags(`${k8sBasePath}/apis/etcd.coreos.com/v1beta1`));
store.dispatch(featureActions.detectPrometheusFlags(`${k8sBasePath}/apis/monitoring.coreos.com/v1alpha1`));
store.dispatch(featureActions.detectMultiClusterFlags());

tectonicVersion();

const init = nextRoute => onRouteChange(undefined, nextRoute);

render((
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App} onEnter={init} onChange={onRouteChange}>
        <IndexRoute component={ClusterOverviewContainer}/>

        <Route path="clusterroles">
          <Route path=":name/add-rule" component={EditRulePage} />
          <Route path=":name/bindings" component={BindingsForRolePage} kind="clusterroles" />
          <Route path=":name/:rule/edit" component={EditRulePage} />
          <Route path=":name/:view" component={ResourceDetailsPage} kind="clusterroles" />
        </Route>

        <Route path="ns/:ns/roles">
          <IndexRoute component={ResourceListPage} kind="role" />
          <Route path=":name/add-rule" component={EditRulePage} />
          <Route path=":name/:rule/edit" component={EditRulePage} />
          <Route path=":name/bindings" component={BindingsForRolePage} kind="role" />
        </Route>

        <Route path="rolebindings/new" component={CreateRoleBinding} />
        <Route path="ns/:ns/rolebindings/new" component={CreateRoleBinding} />
        <Route path="ns/:ns/rolebindings/:name/copy" component={CopyRoleBinding} kind="rolebinding" />
        <Route path="clusterrolebindings/:name/copy" component={CopyRoleBinding} kind="clusterrolebinding" />
        <Route path="ns/:ns/rolebindings/:name/edit" component={EditRoleBinding} kind="rolebinding" />
        <Route path="clusterrolebindings/:name/edit" component={EditRoleBinding} kind="clusterrolebinding" />

        {/* We don't have a Role Bindings details page, so redirect to the list page */}
        <Redirect from="ns/:ns/rolebindings/:name/details" to="all-namespaces/rolebindings" />

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

        <Route path="federation">
          <Route path="clusters" component={Clusters} />
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

window.onerror = function (message, source, lineno, colno) {
  try {
    const e = `${message} ${source} ${lineno} ${colno}`;
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
