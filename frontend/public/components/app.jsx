import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import * as PropTypes from 'prop-types';

import store from '../redux';
import { getCRDs } from '../kinds';
import { featureActions } from '../features';
import { analyticsSvc } from '../module/analytics';
import { authSvc } from '../module/auth';
import { ClusterOverviewContainer } from './cluster-overview-container';
import { ClusterSettingsPage } from './cluster-settings/cluster-settings';
import { LDAPPage } from './cluster-settings/ldap';
import { ContainersDetailsPage } from './container';
import { CreateYAML, EditYAMLPage } from './create-yaml';
import { ErrorPage, ErrorPage404 } from './error';
import { EventStreamPage } from './events';
import { GlobalNotifications } from './global-notifications';
import { NamespaceSelector } from './namespace';
import { Nav } from './nav';
import { ProfilePage } from './profile';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { CopyRoleBinding, CreateRoleBinding, EditRoleBinding, EditRulePage } from './RBAC';
import { StartGuidePage } from './start-guide';
import { SearchPage } from './search';
import { history, Loading, getNamespace } from './utils';
import { UIActions } from '../ui/ui-actions';
import { ClusterHealth } from './cluster-health';
import { CatalogsDetailsPage } from './cloud-services/catalog';
import { ClusterServiceVersionModel } from '../models';
import { referenceForModel } from '../module/k8s';
import '../style.scss';
import * as tectonicLogoImg from '../imgs/tectonic-bycoreos-whitegrn.svg';

// Edge lacks URLSearchParams
require('url-search-params-polyfill');

// React Router's proptypes are incorrect. See https://github.com/ReactTraining/react-router/pull/5393
Route.propTypes.path = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.arrayOf(PropTypes.string),
]);

const LoadingScreen = () => <div className="loading-screen">
  <div className="loading-screen__logo">
    <img src={tectonicLogoImg} id="logo" />
  </div>
  <Loading className="loading-screen__loader" />
  <div>Loading your Tectonic Console</div>
</div>;

// eslint-disable-next-line react/display-name
const boundResourcePage = (Page, plural) => props => <Page {...props} plural={plural} />;

// React router will destroy & recreate components if these are passed in as anonymous functions. Bind them here.
const namespacesListPage = boundResourcePage(ResourceListPage, 'namespaces');
const crdsListPage = boundResourcePage(ResourceListPage, 'customresourcedefinitions');
const nodesListPage = boundResourcePage(ResourceListPage, 'nodes');
const rolesListPage = boundResourcePage(ResourceListPage, 'roles');
const pvsListPage = boundResourcePage(ResourceListPage, 'persistentvolumes');
const nodeDetailsPage = boundResourcePage(ResourceDetailsPage, 'nodes');

class App extends React.PureComponent {
  onRouteChange (props) {
    if (!window.SERVER_FLAGS.authDisabled && !authSvc.isLoggedIn()) {
      authSvc.login();
      return;
    }
    if (props) {
      const namespace = getNamespace(props.location.pathname);
      store.dispatch(UIActions.setCurrentLocation(props.location.pathname, namespace));
    }
    analyticsSvc.route(window.location.pathname);
  }

  componentWillMount () {
    this.onRouteChange(this.props);
  }

  componentWillReceiveProps (nextProps) {
    // Prevent infinite loop in case React Router decides to destroy & recreate the component (changing key)
    const oldLocation = _.omit(this.props.location, ['key']);
    const newLocation = _.omit(nextProps.location, ['key']);
    if (_.isEqual(newLocation, oldLocation) && _.isEqual(nextProps.match, this.props.match)) {
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
          <Route path={[
            '/all-namespaces',
            '/ns/:ns',
            '/k8s/all-namespaces',
            '/k8s/ns/:ns',
          ]} component={NamespaceSelector} />
          <Switch>
            <Route path="/" exact component={ClusterOverviewContainer} />
            <Route path="/cluster-health" exact component={ClusterHealth} />

            <Route path="/start-guide" exact component={StartGuidePage} />

            <Route path="/ns/:ns/clusterserviceversion-v1s/:name/edit" exact component={props => <EditYAMLPage {...props} kind={referenceForModel(ClusterServiceVersionModel)} />}/>
            <Route path="/ns/:ns/clusterserviceversion-v1s/:appName/:plural/new" exact component={CreateYAML} />
            <Route path="/ns/:ns/clusterserviceversion-v1s/:appName/:plural/:name" component={ResourceDetailsPage} />
            <Route path="/catalog" exact component={CatalogsDetailsPage} />

            <Route path="/clusterroles/:name/add-rule" exact component={EditRulePage} />
            <Route path="/clusterroles/:name/:rule/edit" exact component={EditRulePage} />
            <Route path="/clusterroles/:name" component={props => <ResourceDetailsPage {...props} plural="clusterroles" />} />

            <Route path="/ns/:ns/roles/:name/add-rule" exact component={EditRulePage} />
            <Route path="/ns/:ns/roles/:name/:rule/edit" exact component={EditRulePage} />
            <Route path="/ns/:ns/roles" exact component={rolesListPage} />

            <Route path="/rolebindings/new" exact component={props => <CreateRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/ns/:ns/rolebindings/new" exact component={props => <CreateRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/ns/:ns/rolebindings/:name/copy" exact component={props => <CopyRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/ns/:ns/rolebindings/:name/edit" exact component={props => <EditRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/clusterrolebindings/:name/copy" exact component={props => <CopyRoleBinding {...props} kind="ClusterRoleBinding" />} />
            <Route path="/clusterrolebindings/:name/edit" exact component={props => <EditRoleBinding {...props} kind="ClusterRoleBinding" />} />

            <Redirect from="/ns/:ns/rolebindings/:name" to="/all-namespaces/rolebindings" />

            <Route path="/k8s/cluster/:plural" exact component={ResourceListPage} />
            <Route path="/k8s/cluster/:plural/:name" component={ResourceDetailsPage} />
            <Route path="/k8s/ns/:ns/:plural/new" exact component={CreateYAML} />
            <Route path="/k8s/ns/:ns/:plural/:name" component={ResourceDetailsPage} />
            <Route path="/k8s/ns/:ns/:plural" exact component={ResourceListPage} />

            <Route path="/k8s/all-namespaces/:plural" exact component={ResourceListPage} />
            <Route path="/k8s/all-namespaces/:plural/:name" component={ResourceDetailsPage} />

            <Route path="/namespaces/:name" component={props => <ResourceDetailsPage {...props} plural="namespaces" />} />
            <Route path="/namespaces" exact component={namespacesListPage} />
            <Route path="/crds" exact component={crdsListPage} />
            <Redirect from="/customresourcedefinitions/:name" to="/crds" />

            <Route path="/nodes/:name" component={nodeDetailsPage} />
            <Route path="/nodes" exact component={nodesListPage} />

            <Route path="/persistentvolumes/:name" component={props => <ResourceDetailsPage {...props} plural="persistentvolumes" />} />
            <Route path="/persistentvolumes" exact component={pvsListPage} />

            <Route path="/settings/profile" exact component={ProfilePage} />
            <Route path="/settings/ldap" exact component={LDAPPage} />
            <Route path="/settings/cluster" exact component={ClusterSettingsPage} />

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

store.dispatch(featureActions.detectSecurityLabellerFlags);
store.dispatch(featureActions.detectCalicoFlags);
store.dispatch(getCRDs);

analyticsSvc.push({tier: 'tectonic'});

// For GUI tests. Set this flag if any unhandled errors
window.windowError = false;

window.onerror = function (message, source, lineno, colno, optError={}) {
  try {
    const e = `${message} ${source} ${lineno} ${colno}`;
    analyticsSvc.error(e, null, optError.stack);
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.error(err);
    } catch (ignored) {
      // ignore
    }
  }
  window.windowError = true;
  // window.windowErrors only exists if we're running in gui tests
  window.windowErrors && window.windowErrors.push([message, source, lineno, colno, optError]);
};

window.onunhandledrejection = function (e) {
  try {
    analyticsSvc.error(e, null);
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.error(err);
    } catch (ignored) {
      // ignore
    }
  }
  window.windowError = true;
  const {promise, reason} = event;
  // window.windowErrors only exists if we're running in gui tests
  window.windowErrors && window.windowErrors.push([reason, promise]);
};

render((
  <Provider store={store}>
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Route path="/" component={App} />
    </Router>
  </Provider>
), document.getElementById('app'));
