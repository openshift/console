import * as _ from 'lodash-es';
import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import * as PropTypes from 'prop-types';

import store from '../redux';
import { productName } from '../branding';
import { ALL_NAMESPACES_KEY } from '../const';
import { connectToFlags, featureActions, flagPending, FLAGS } from '../features';
import { detectMonitoringURLs } from '../monitoring';
import { analyticsSvc } from '../module/analytics';
import { GlobalNotifications } from './global-notifications';
import { Masthead } from './masthead';
import { NamespaceSelector } from './namespace';
import { Nav } from './nav';
import { SearchPage } from './search';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { history, AsyncComponent, Loading } from './utils';
import { namespacedPrefixes } from './utils/link';
import { UIActions, getActiveNamespace } from '../ui/ui-actions';
import { ClusterServiceVersionModel, SubscriptionModel, AlertmanagerModel } from '../models';
import { referenceForModel } from '../module/k8s';
import k8sActions from '../module/k8s/k8s-actions';
import '../vendor.scss';
import '../style.scss';

// Edge lacks URLSearchParams
import 'url-search-params-polyfill';

// React Router's proptypes are incorrect. See https://github.com/ReactTraining/react-router/pull/5393
Route.propTypes.path = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.arrayOf(PropTypes.string),
]);

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
    to = '/status/all-namespaces';
  } else if (activeNamespace) {
    to = `/status/ns/${activeNamespace}`;
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

const LazyRoute = (props) => <Route {...props} component={(componentProps) => <AsyncComponent loader={props.loader} kind={props.kind} {...componentProps} />} />;

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

  render () {
    return <React.Fragment>
      <Helmet titleTemplate={`%s · ${productName}`} defaultTitle={productName} />
      <Masthead />
      <Nav />
      <div id="content">
        <Route path={namespacedRoutes} component={NamespaceSelector} />
        <GlobalNotifications />
        <Switch>
          <Route path={['/all-namespaces', '/ns/:ns',]} component={RedirectComponent} />
          <LazyRoute path="/status/all-namespaces" exact loader={() => import('./cluster-overview' /* webpackChunkName: "cluster-overview" */).then(m => m.ClusterOverviewPage)} />
          <LazyRoute path="/status/ns/:ns" exact loader={() => import('./cluster-overview' /* webpackChunkName: "cluster-overview" */).then(m => m.ClusterOverviewPage)} />
          <Route path="/status" exact component={NamespaceRedirect} />
          <LazyRoute path="/cluster-health" exact loader={() => import('./cluster-health' /* webpackChunkName: "cluster-health" */).then(m => m.ClusterHealth)} />
          <LazyRoute path="/start-guide" exact loader={() => import('./start-guide' /* webpackChunkName: "start-guide" */).then(m => m.StartGuidePage)} />

          <LazyRoute path={`/k8s/ns/:ns/${SubscriptionModel.plural}/new`} exact loader={() => import('./cloud-services').then(m => NamespaceFromURL(m.CreateSubscriptionYAML))} />

          <Route path="/k8s/ns/:ns/alertmanagers/:name" exact render={({match}) => <Redirect to={`/k8s/ns/${match.params.ns}/${referenceForModel(AlertmanagerModel)}/${match.params.name}`} />} />

          <LazyRoute path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/new`} exact loader={() => import('./cloud-services/create-crd-yaml').then(m => m.CreateCRDYAML)} />
          <Route path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`} component={ResourceDetailsPage} />

          <LazyRoute path="/k8s/all-namespaces/events" exact loader={() => import('./events').then(m => NamespaceFromURL(m.EventStreamPage))} />
          <LazyRoute path="/k8s/ns/:ns/events" exact loader={() => import('./events').then(m => NamespaceFromURL(m.EventStreamPage))} />
          <Route path="/search/all-namespaces" exact component={NamespaceFromURL(SearchPage)} />
          <Route path="/search/ns/:ns" exact component={NamespaceFromURL(SearchPage)} />
          <Route path="/search" exact component={ActiveNamespaceRedirect} />

          <Route path="/k8s/ns/:ns/customresourcedefinitions/:plural" exact component={ResourceListPage} />
          <Route path="/k8s/ns/:ns/customresourcedefinitions/:plural/:name" component={ResourceDetailsPage} />
          <Route path="/k8s/all-namespaces/customresourcedefinitions/:plural" exact component={ResourceListPage} />
          <Route path="/k8s/all-namespaces/customresourcedefinitions/:plural/:name" component={ResourceDetailsPage} />

          {
            // These pages are temporarily disabled. We need to update the safe resources list.
            // <LazyRoute path="/k8s/cluster/clusterroles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
            // <LazyRoute path="/k8s/cluster/clusterroles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
          }
          <Route path="/k8s/cluster/clusterroles/:name" component={props => <ResourceDetailsPage {...props} plural="clusterroles" />} />

          {
            // <LazyRoute path="/k8s/ns/:ns/roles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
            // <LazyRoute path="/k8s/ns/:ns/roles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
          }

          <LazyRoute path="/k8s/ns/:ns/secrets/new/:type" exact kind="Secret" loader={() => import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(m => m.CreateSecret)} />
          <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit" exact kind="Secret" loader={() => import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(m => m.EditSecret)} />
          <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit-yaml" exact kind="Secret" loader={() => import('./create-yaml').then(m => m.EditYAMLPage)} />

          <LazyRoute path="/k8s/cluster/rolebindings/new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/copy" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
          <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/edit" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />
          <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/copy" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
          <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/edit" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />

          <Route path="/k8s/cluster/:plural" exact component={ResourceListPage} />
          <LazyRoute path="/k8s/cluster/:plural/new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => m.CreateYAML)} />
          <Route path="/k8s/cluster/:plural/:name" component={ResourceDetailsPage} />
          <LazyRoute path="/k8s/ns/:ns/pods/:podName/containers/:name" loader={() => import('./container').then(m => m.ContainersDetailsPage)} />
          <LazyRoute path="/k8s/ns/:ns/:plural/new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => NamespaceFromURL(m.CreateYAML))} />
          <Route path="/k8s/ns/:ns/:plural/:name" component={ResourceDetailsPage} />
          <Route path="/k8s/ns/:ns/:plural" exact component={ResourceListPage} />

          <Route path="/k8s/all-namespaces/:plural" exact component={ResourceListPage} />
          <Route path="/k8s/all-namespaces/:plural/:name" component={ResourceDetailsPage} />

          <LazyRoute path="/settings/profile" exact loader={() => import('./profile').then(m => m.ProfilePage)} />
          <LazyRoute path="/settings/ldap" exact loader={() => import('./cluster-settings/ldap').then(m => m.LDAPPage)} />
          <LazyRoute path="/settings/cluster" exact loader={() => import('./cluster-settings/cluster-settings').then(m => m.ClusterSettingsPage)} />

          <LazyRoute path="/error" exact loader={() => import('./error').then(m => m.ErrorPage)} />
          <Route path="/" exact component={DefaultPage} />

          <LazyRoute loader={() => import('./error').then(m => m.ErrorPage404)} />
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
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => registrations.forEach(reg => reg.unregister()))
      // eslint-disable-next-line no-console
      .catch(e => console.warn('Error unregistering service workers', e));
  }
}

render((
  <Provider store={store}>
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Route path="/" component={App} />
    </Router>
  </Provider>
), document.getElementById('app'));
