import * as _ from 'lodash-es';
import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import * as PropTypes from 'prop-types';

import store from '../redux';
import { ALL_NAMESPACES_KEY } from '../const';
import { connectToFlags, featureActions, flagPending, FLAGS } from '../features';
import { detectMonitoringURLs } from '../monitoring';
import { analyticsSvc } from '../module/analytics';
import { ClusterOverviewContainer } from './cluster-overview-container';
import { ClusterSettingsPage } from './cluster-settings/cluster-settings';
import { LDAPPage } from './cluster-settings/ldap';
import { ContainersDetailsPage } from './container';
import { CreateYAML, EditYAMLPage } from './create-yaml';
import { ErrorPage, ErrorPage404 } from './error';
import { EventStreamPage } from './events';
import { GlobalNotifications } from './global-notifications';
import { Masthead } from './masthead';
import { NamespaceSelector } from './namespace';
import { Nav } from './nav';
import { ProfilePage } from './profile';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { CopyRoleBinding, CreateRoleBinding, EditRoleBinding, EditRulePage } from './RBAC';
import { CreateSecret, EditSecret } from './secrets/create-secret';
import { StartGuidePage } from './start-guide';
import { SearchPage } from './search';
import { history, AsyncComponent, Loading } from './utils';
import { namespacedPrefixes } from './utils/link';
import { UIActions, getActiveNamespace } from '../ui/ui-actions';
import { ClusterHealth } from './cluster-health';
import { CatalogSourceDetailsPage, CreateSubscriptionYAML } from './cloud-services';
import { CreateCRDYAML } from './cloud-services/create-crd-yaml';
import { ClusterServiceVersionModel, CatalogSourceModel, AlertmanagerModel } from '../models';
import { referenceForModel } from '../module/k8s';
import k8sActions from '../module/k8s/k8s-actions';
import { coFetch } from '../co-fetch';
import '../vendor.scss';
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

// Ensure a *const* function wrapper for each namespaced Component so that react router doesn't recreate them
const Memoized = new Map();
function NamespaceFromURL (Component) {
  let C = Memoized.get(Component);
  if (!C) {
    C = function NamespaceInjector(props) {
      return <Component namespace={props.match.params.ns} {...props} />;
    };
    Memoized.set(Component, C);
  }
  return C;
}

const namespacedRoutes = [];
_.each(namespacedPrefixes, p => {
  namespacedRoutes.push(`${p}/ns/:ns`);
  namespacedRoutes.push(`${p}/all-namespaces`);
});

const NamespaceRedirect = () => {
  const activeNamespace = getActiveNamespace();

  let to;
  if (activeNamespace === ALL_NAMESPACES_KEY) {
    to = '/overview/all-namespaces';
  } else if (activeNamespace) {
    to = `/overview/ns/${activeNamespace}`;
  }
  // TODO: check if namespace exists
  return <Redirect to={to} />;
};

const ActiveNamespaceRedirect = ({location}) => {
  const activeNamespace = getActiveNamespace();

  let to;
  if (activeNamespace === ALL_NAMESPACES_KEY) {
    to = '/search/all-namespaces';
  } else if (activeNamespace) {
    to = `/search/ns/${activeNamespace}`;
  }

  to += location.search;
  return <Redirect to={to} />;
};

// The default page component lets us connect to flags without connecting the entire App.
const DefaultPage = connectToFlags(FLAGS.OPENSHIFT)(({ flags }) => {
  const openshiftFlag = flags[FLAGS.OPENSHIFT];
  if (flagPending(openshiftFlag)) {
    return <Loading />;
  }

  if (openshiftFlag) {
    return <Redirect to="/k8s/cluster/projects" />;
  }

  return <NamespaceRedirect />;
});

class App extends React.PureComponent {
  componentDidUpdate (prevProps) {
    const props = this.props;
    // Prevent infinite loop in case React Router decides to destroy & recreate the component (changing key)
    const oldLocation = _.omit(prevProps.location, ['key']);
    const newLocation = _.omit(props.location, ['key']);
    if (_.isEqual(newLocation, oldLocation) && _.isEqual(props.match, prevProps.match)) {
      return;
    }
    // two way data binding :-/
    const { pathname } = props.location;
    store.dispatch(UIActions.setCurrentLocation(pathname));
    analyticsSvc.route(pathname);
  }

  getProductName () {
    switch (window.SERVER_FLAGS.branding) {
      case 'ocp':
        return 'OpenShift Container Platform';
      case 'online':
        return 'OpenShift Online';
      default:
        return 'OpenShift Origin';
    }
  }

  render () {
    const productName = this.getProductName();
    return <React.Fragment>
      <Helmet titleTemplate={`%s · ${productName}`} defaultTitle={productName} />
      <Masthead />
      <Nav />
      <div id="content">
        <Route path={namespacedRoutes} component={NamespaceSelector} />
        <GlobalNotifications />
        <Switch>
          <Route path={['/all-namespaces', '/ns/:ns',]} component={RedirectComponent} />
          <Route path="/overview/all-namespaces" exact component={ClusterOverviewContainer} />
          <Route path="/overview/ns/:ns" exact component={ClusterOverviewContainer} />
          <Route path="/overview" exact component={NamespaceRedirect} />
          <Route path="/cluster-health" exact component={ClusterHealth} />
          <Route path="/start-guide" exact component={StartGuidePage} />

          <Route path={`/k8s/all-namespaces/${CatalogSourceModel.plural}`} exact render={() => <Redirect to={`/k8s/all-namespaces/${CatalogSourceModel.plural}/tectonic-ocs`} />} />
          <Route path={`/k8s/ns/:ns/${CatalogSourceModel.plural}`} exact render={({match}) => <Redirect to={`/k8s/ns/${match.params.ns}/${CatalogSourceModel.plural}/tectonic-ocs`} />} />
          <Route path={`/k8s/all-namespaces/${CatalogSourceModel.plural}/tectonic-ocs`} exact component={CatalogSourceDetailsPage} />
          <Route path={`/k8s/ns/:ns/${CatalogSourceModel.plural}/tectonic-ocs`} exact component={CatalogSourceDetailsPage} />
          <Route path={`/k8s/all-namespaces/${CatalogSourceModel.plural}/tectonic-ocs/:pkgName/subscribe`} exact component={CreateSubscriptionYAML} />
          <Route path={`/k8s/ns/:ns/${CatalogSourceModel.plural}/tectonic-ocs/:pkgName/subscribe`} exact component={NamespaceFromURL(CreateSubscriptionYAML)} />

          <Route path="/k8s/ns/:ns/alertmanagers/:name" exact render={({match}) => <Redirect to={`/k8s/ns/${match.params.ns}/${referenceForModel(AlertmanagerModel)}/${match.params.name}`} />} />

          <Route path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:name/edit`} exact component={props => <EditYAMLPage {...props} kind={referenceForModel(ClusterServiceVersionModel)} />}/>
          <Route path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/new`} exact component={NamespaceFromURL(CreateCRDYAML)} />
          <Route path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`} component={ResourceDetailsPage} />

          <Route path="/k8s/all-namespaces/events" exact component={NamespaceFromURL(EventStreamPage)} />
          <Route path="/k8s/ns/:ns/events" exact component={NamespaceFromURL(EventStreamPage)} />
          <Route path="/search/all-namespaces" exact component={NamespaceFromURL(SearchPage)} />
          <Route path="/search/ns/:ns" exact component={NamespaceFromURL(SearchPage)} />
          <Route path="/search" exact component={ActiveNamespaceRedirect} />

          <Route path="/k8s/cluster/clusterroles/:name/add-rule" exact component={EditRulePage} />
          <Route path="/k8s/cluster/clusterroles/:name/:rule/edit" exact component={EditRulePage} />
          <Route path="/k8s/cluster/clusterroles/:name" component={props => <ResourceDetailsPage {...props} plural="clusterroles" />} />

          <Route path="/k8s/ns/:ns/roles/:name/add-rule" exact component={EditRulePage} />
          <Route path="/k8s/ns/:ns/roles/:name/:rule/edit" exact component={EditRulePage} />
          <Route path="/k8s/ns/:ns/roles" exact component={rolesListPage} />

          <Route path="/k8s/ns/:ns/secrets/new/:type" exact component={props => <CreateSecret {...props} kind="Secret" />} />
          <Route path="/k8s/ns/:ns/secrets/:name/edit" exact component={props => <EditSecret {...props} kind="Secret" />} />
          <Route path="/k8s/ns/:ns/secrets/:name/edit-yaml" exact component={props => <EditYAMLPage {...props} kind="Secret" />} />

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
          <Route path="/k8s/ns/:ns/:plural/new" exact component={NamespaceFromURL(CreateYAML)} />
          <Route path="/k8s/ns/:ns/:plural/:name" component={ResourceDetailsPage} />
          <Route path="/k8s/ns/:ns/:plural" exact component={ResourceListPage} />

          <Route path="/k8s/all-namespaces/:plural" exact component={ResourceListPage} />
          <Route path="/k8s/all-namespaces/:plural/:name" component={ResourceDetailsPage} />

          <Route path="/settings/profile" exact component={ProfilePage} />
          <Route path="/settings/ldap" exact component={LDAPPage} />
          <Route path="/settings/cluster" exact component={ClusterSettingsPage} />

          <Route path="/error" exact component={ErrorPage} />
          <Route path="/" exact component={DefaultPage} />

          <Route component={ErrorPage404} />
        </Switch>
      </div>
    </React.Fragment>;
  }
}


_.each(featureActions, store.dispatch);
store.dispatch(k8sActions.getResources());
store.dispatch(detectMonitoringURLs);

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

if ('serviceWorker' in navigator) {
  if (window.SERVER_FLAGS.loadTestFactor > 1) {
    import('file-loader?name=load-test.sw.js!../load-test.sw.js')
      .then(() => navigator.serviceWorker.register('/load-test.sw.js'))
      .then(() => new Promise(r => navigator.serviceWorker.controller ? r() : navigator.serviceWorker.addEventListener('controllerchange', () => r())))
      .then(() => navigator.serviceWorker.controller.postMessage({topic: 'setFactor', value: window.SERVER_FLAGS.loadTestFactor}));
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach(reg => reg.unregister()));
  }
}

const AppGuard = (props) => <AsyncComponent loader={() => coFetch('api/tectonic/version').then(() => App)} {...props} />;

render((
  <Provider store={store}>
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Route path="/" component={AppGuard} />
    </Router>
  </Provider>
), document.getElementById('app'));
