import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { Redirect, Route, Router, Switch } from 'react-router-dom';

import store from '../redux';
import { getCRDs } from '../kinds';
import { featureActions } from '../features';
import { analyticsSvc } from '../module/analytics';
import { authSvc } from '../module/auth';
import { UIActions } from '../ui/ui-actions';
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
import { StartGuidePage } from './start-guide';
import { SearchPage } from './search';
import { history, Loading } from './utils';
import { Clusters } from './federation/cluster';
import '../style.scss';
import * as tectonicLogoImg from '../imgs/tectonic-bycoreos-whitegrn.svg';

require('url-search-params-polyfill');

const LoadingScreen = () => <div className="loading-screen">
  <div className="loading-screen__logo">
    <img src={tectonicLogoImg} id="logo" />
  </div>
  <Loading className="loading-screen__loader" />
  <div>Loading your Tectonic Console</div>
</div>;


class App extends React.PureComponent {
  onRouteChange (props) {
    if (!window.SERVER_FLAGS.authDisabled && !authSvc.isLoggedIn()) {
      authSvc.login();
      return;
    }
    if (props) {
      store.dispatch(UIActions.setCurrentLocation(props.location.pathname, _.get(props, 'match.params.ns')));
    }
    analyticsSvc.route(window.location.pathname);
  }

  componentWillMount () {
    this.onRouteChange(this.props);
  }

  componentWillReceiveProps (nextProps) {
    if (_.isEqual(nextProps.location, this.props.location) && _.isEqual(nextProps.match, this.props.match)) {
      return;
    }
    this.onRouteChange(nextProps);
  }

  render () {
    return <div className="co-container">
      <Helmet titleTemplate="%s · Tectonic" />

      {!window.SERVER_FLAGS.authDisabled && !authSvc.isLoggedIn() && <LoadingScreen />}

      <GlobalNotifications />

      <div id="reflex">
        <Nav />
        <div id="content">
          <NamespaceSelector />
          <Switch>
            <Route path="/" exact component={ClusterOverviewContainer} />
            <Route path="/start-guide" exact component={StartGuidePage} />

            <Route path="/clusterroles/:name/add-rule" exact component={EditRulePage} />
            <Route path="/clusterroles/:name/bindings" exact component={props => <BindingsForRolePage {...props} kind="ClusterRole" />} />
            <Route path="/clusterroles/:name/:rule/edit" exact component={EditRulePage} />
            <Route path="/clusterroles/:name" component={props => <ResourceDetailsPage {...props} plural="clusterroles" />} />

            <Route path="/ns/:ns/roles/:name/add-rule" exact component={EditRulePage} />
            <Route path="/ns/:ns/roles/:name/:rule/edit" exact component={EditRulePage} />
            <Route path="/ns/:ns/roles/:name/bindings" exact component={props => <BindingsForRolePage {...props} kind="Role" />} />
            <Route path="/ns/:ns/roles" exact component={props => <ResourceListPage {...props} plural="roles" />} />

            <Route path="/rolebindings/new" exact component={props => <CreateRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/ns/:ns/rolebindings/new" exact component={props => <CreateRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/ns/:ns/rolebindings/:name/copy" exact component={props => <CopyRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/ns/:ns/rolebindings/:name/edit" exact component={props => <EditRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/clusterrolebindings/:name/copy" exact component={props => <CopyRoleBinding {...props} kind="ClusterRoleBinding" />} />
            <Route path="/clusterrolebindings/:name/edit" exact component={props => <EditRoleBinding {...props} kind="ClusterRoleBinding" />} />

            <Redirect from="/ns/:ns/rolebindings/:name/details" to="/all-namespaces/rolebindings" />

            <Route path="/namespaces/:name" component={props => <ResourceDetailsPage {...props} plural="namespaces" />} />
            <Route path="/namespaces" exact component={props => <ResourceListPage {...props} plural="namespaces" />} />
            <Route path="/crds" exact component={props => <ResourceListPage {...props} plural="customresourcedefinitions" />} />

            <Route path="/nodes/:name" component={props => <ResourceDetailsPage {...props} plural="nodes" />} />
            <Route path="/nodes" exact component={props => <ResourceListPage {...props} plural="nodes" />} />

            <Route path="/settings/profile" exact component={ProfilePage} />
            <Route path="/settings/ldap" exact component={LDAPPage} />
            <Route path="/settings/cluster" exact component={ClusterSettingsPage} />

            <Route path="/federation/clusters" exact component={Clusters} />

            <Route path="/all-namespaces/events" exact component={EventStreamPage} />
            <Route path="/ns/:ns/events" exact component={EventStreamPage} />

            <Route path="/all-namespaces/search" exact component={SearchPage} />
            <Route path="/ns/:ns/search" exact component={SearchPage} />
            <Route path="/search" exact component={props => <Redirect from="/search" to={{pathname: '/all-namespaces/search', search: props.location.search}} />} />

            <Route path="/all-namespaces/:plural" exact component={ResourceListPage} />
            <Route path="/ns/:ns/pods/:podName/containers/:name" component={ContainersDetailsPage} />
            <Route path="/ns/:ns/:plural/new" exact component={CreateYAML} />
            <Route path="/ns/:ns/:plural/:name" component={ResourceDetailsPage} />
            <Route path="/ns/:ns/:plural" exact component={ResourceListPage} />

            <Route path="/error" exact component={ErrorPage} />
            <Route component={ErrorPage404} />
          </Switch>
        </div>
      </div>
    </div>;
  }
}

store.dispatch(featureActions.detectTectonicChannelOperatorFlags);
store.dispatch(featureActions.detectEtcdOperatorFlags);
store.dispatch(featureActions.detectPrometheusFlags);
store.dispatch(featureActions.detectMultiClusterFlags);
store.dispatch(featureActions.detectSecurityLabellerFlags);
store.dispatch(featureActions.detectCloudServicesFlags);
store.dispatch(getCRDs);

analyticsSvc.push({tier: 'tectonic'});

render((
  <Provider store={store}>
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Route path="/" component={App} />
    </Router>
  </Provider>
), document.getElementById('app'));

window.onerror = function (message, source, lineno, colno, optError={}) {
  try {
    const e = `${message} ${source} ${lineno} ${colno}`;
    analyticsSvc.error(e, null, optError.stack);
  } catch(err) {
    try {
      // eslint-disable-next-line no-console
      console.error(err);
    } catch (ignored) {
      // ignore
    }
  }
};
