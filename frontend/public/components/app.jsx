import * as _ from 'lodash';
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
import { history, getNamespace, AsyncComponent } from './utils';
import { namespacedPrefixes } from './utils/link';
import { UIActions } from '../ui/ui-actions';
import { ClusterHealth } from './cluster-health';
import { CatalogsDetailsPage, ClusterServiceVersionsPage, ClusterServiceVersionsDetailsPage } from './cloud-services';
import { ClusterServiceVersionModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { coFetch } from '../co-fetch';
import '../style.scss';

// Edge lacks URLSearchParams
import 'url-search-params-polyfill';

// React Router's proptypes are incorrect. See https://github.com/ReactTraining/react-router/pull/5393
Route.propTypes.path = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.arrayOf(PropTypes.string),
]);

// eslint-disable-next-line react/display-name
const boundResourcePage = (Page, plural) => props => <Page {...props} plural={plural} />;

// React router will destroy & recreate components if these are passed in as anonymous functions. Bind them here.
const rolesListPage = boundResourcePage(ResourceListPage, 'roles');

const RedirectComponent = props => {
  const to = `/k8s${props.location.pathname}`;
  return <Redirect to={to} />;
};

const namespacedRoutes = [];
_.each(namespacedPrefixes, p => {
  namespacedRoutes.push(`${p}/ns/:ns`);
  namespacedRoutes.push(`${p}/all-namespaces`);
});

class App extends React.PureComponent {
  onRouteChange (props) {
    if (props) {
      // two way data binding :-/
      const namespace = getNamespace(props.location.pathname);
      store.dispatch(UIActions.setCurrentLocation(props.location.pathname, namespace));
    }
    analyticsSvc.route(window.location.pathname);
  }

  componentWillMount () {
    // load the location from the window
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

      <GlobalNotifications />

      <div id="reflex">
        <Nav />
        <div id="content">
          <Route path={namespacedRoutes} component={NamespaceSelector} />
          <Switch>
            <Route path={['/all-namespaces', '/ns/:ns',]} component={RedirectComponent} />
            <Route path="/overview/all-namespaces" exact component={ClusterOverviewContainer} />
            <Route path="/overview/ns/:ns" exact component={ClusterOverviewContainer} />
            <Route path="/cluster-health" exact component={ClusterHealth} />
            <Route path="/start-guide" exact component={StartGuidePage} />

            <Route path={`/k8s/ns/:ns/${referenceForModel(ClusterServiceVersionModel)}/:name`} render={({match}) => <Redirect to={`/applications/ns/${match.params.ns}/${match.params.name}`} />} />
            <Route path="/applications/all-namespaces" exact component={ClusterServiceVersionsPage} />
            <Route path="/applications/ns/:ns" exact component={ClusterServiceVersionsPage} />
            <Route path="/applications/ns/:ns/:name/edit" exact component={props => <EditYAMLPage {...props} kind={referenceForModel(ClusterServiceVersionModel)} />}/>
            <Route path="/applications/ns/:ns/:appName/:plural/new" exact component={CreateYAML} />
            <Route path="/applications/ns/:ns/:appName/:plural/:name" component={ResourceDetailsPage} />
            <Route path="/applications/ns/:ns/:name" component={ClusterServiceVersionsDetailsPage} />
            <Route path="/catalog" exact component={CatalogsDetailsPage} />

            <Route path="/k8s/all-namespaces/events" exact component={EventStreamPage} />
            <Route path="/k8s/ns/:ns/events" exact component={EventStreamPage} />
            <Route path="/search/all-namespaces" exact component={SearchPage} />
            <Route path="/search/ns/:ns" exact component={SearchPage} />

            <Route path="/k8s/cluster/clusterroles/:name/add-rule" exact component={EditRulePage} />
            <Route path="/k8s/cluster/clusterroles/:name/:rule/edit" exact component={EditRulePage} />
            <Route path="/k8s/cluster/clusterroles/:name" component={props => <ResourceDetailsPage {...props} plural="clusterroles" />} />

            <Route path="/k8s/ns/:ns/roles/:name/add-rule" exact component={EditRulePage} />
            <Route path="/k8s/ns/:ns/roles/:name/:rule/edit" exact component={EditRulePage} />
            <Route path="/k8s/ns/:ns/roles" exact component={rolesListPage} />

            <Route path="/k8s/cluster/rolebindings/new" exact component={props => <CreateRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/k8s/ns/:ns/rolebindings/new" exact component={props => <CreateRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/k8s/ns/:ns/rolebindings/:name/copy" exact component={props => <CopyRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/k8s/ns/:ns/rolebindings/:name/edit" exact component={props => <EditRoleBinding {...props} kind="RoleBinding" />} />
            <Route path="/k8s/cluster/clusterrolebindings/:name/copy" exact component={props => <CopyRoleBinding {...props} kind="ClusterRoleBinding" />} />
            <Route path="/k8s/cluster/clusterrolebindings/:name/edit" exact component={props => <EditRoleBinding {...props} kind="ClusterRoleBinding" />} />

            <Route path="/k8s/cluster/:plural" exact component={ResourceListPage} />
            <Route path="/k8s/cluster/:plural/new" exact component={CreateYAML} />
            <Route path="/k8s/cluster/:plural/:name" component={ResourceDetailsPage} />
            <Route path="/k8s/ns/:ns/pods/:podName/containers/:name" component={ContainersDetailsPage} />
            <Route path="/k8s/ns/:ns/:plural/new" exact component={CreateYAML} />
            <Route path="/k8s/ns/:ns/:plural/:name" component={ResourceDetailsPage} />
            <Route path="/k8s/ns/:ns/:plural" exact component={ResourceListPage} />

            <Route path="/k8s/all-namespaces/:plural" exact component={ResourceListPage} />
            <Route path="/k8s/all-namespaces/:plural/:name" component={ResourceDetailsPage} />

            <Route path="/settings/profile" exact component={ProfilePage} />
            <Route path="/settings/ldap" exact component={LDAPPage} />
            <Route path="/settings/cluster" exact component={ClusterSettingsPage} />

            <Route path="/error" exact component={ErrorPage} />
            <Redirect from="/" to="/overview/all-namespaces" exact />

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

// Used by GUI tests to check for unhandled exceptions
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
};

const AppGuard = (props) => <AsyncComponent loader={() => coFetch('api/tectonic/version').then(() => App)} {...props} />;

render((
  <Provider store={store}>
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Route path="/" component={AppGuard} />
    </Router>
  </Provider>
), document.getElementById('app'));
