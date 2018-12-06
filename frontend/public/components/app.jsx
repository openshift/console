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
import { analyticsSvc } from '../module/analytics';
import { MonitoringUI } from './monitoring';
import { ClusterSettingsPage } from './cluster-settings/cluster-settings';
import { GlobalNotifications } from './global-notifications';
import { NamespaceBar } from './namespace';
import { SearchPage } from './search';
import { ResourceDetailsPage, ResourceListPage } from './resource-list';
import { history, AsyncComponent, Loading } from './utils';
import { namespacedPrefixes } from './utils/link';
import { UIActions, getActiveNamespace } from '../ui/ui-actions';
import { ClusterServiceVersionModel, SubscriptionModel, AlertmanagerModel } from '../models';
import { getCachedResources, referenceForModel } from '../module/k8s';
import k8sActions, { types } from '../module/k8s/k8s-actions';
import '../vendor.scss';
import '../style.scss';

//PF4 Imports
import {
  BackgroundImage,
  BackgroundImageSrc,
  Page,
  PageSection,
  PageSectionVariants,
} from '@patternfly/react-core';
import { global_breakpoint_md as breakpointMd } from '@patternfly/react-tokens';

import bgFilter from '../../public/imgs/background-filter.svg';
import pfBg576 from '../../public/imgs/pfbg_576.jpg';
import pfBg576R2x from '../../public/imgs/pfbg_576@2x.jpg';
import pfBg768 from '../../public/imgs/pfbg_768.jpg';
import pfBg768R2x from '../../public/imgs/pfbg_768@2x.jpg';
import pfBg992 from '../../public/imgs/pfbg_992.jpg';
import pfBg992R2x from '../../public/imgs/pfbg_992@2x.jpg';
import pfBg1200 from '../../public/imgs/pfbg_1200.jpg';
import pfBg2000 from '../../public/imgs/pfbg_2000.jpg';

import AppHeader from './app-header';
import AppNav from './nav';

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
function NamespaceFromURL(Component) {
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

const appendActiveNamespace = pathname => {
  const basePath = pathname.replace(/\/$/, '');
  const activeNamespace = getActiveNamespace();
  return activeNamespace === ALL_NAMESPACES_KEY ? `${basePath}/all-namespaces` : `${basePath}/ns/${activeNamespace}`;
};

const NamespaceRedirect = ({location: {pathname}}) => {
  const to = appendActiveNamespace(pathname) + location.search;
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

  const statusPage = appendActiveNamespace('/status');
  return <Redirect to={statusPage} />;
});

const LazyRoute = (props) => <Route {...props} render={(componentProps) => <AsyncComponent loader={props.loader} kind={props.kind} {...componentProps} />} />;

class App extends React.PureComponent {
  constructor(props) {
    super(props);

    this._onNavToggle = this._onNavToggle.bind(this);
    this._onNavSelect = this._onNavSelect.bind(this);
    this._handleScroll = this._handleScroll.bind(this);
    this._isDesktop = this._isDesktop.bind(this);
    this._handleCondensedHeader = this._handleCondensedHeader.bind(this);

    this.state = {
      isNavOpen: this._isDesktop(),
    };
  }
  componentDidMount(){
    //overrides default pf4 scroll container for now to use #content scrollable
    this.scrollable = document.querySelector('#content-scrollable');
    this.scrollable.addEventListener('scroll', _.debounce(this._handleScroll, 16)); //single frame
    window.addEventListener('resize', this._handleCondensedHeader);
    this._handleCondensedHeader();
  }
  componentDidUpdate(prevProps) {
    const props = this.props;
    // Prevent infinite loop in case React Router decides to destroy & recreate the component (changing key)
    const oldLocation = _.omit(prevProps.location, ['key']);
    const newLocation = _.omit(props.location, ['key']);
    if (
      _.isEqual(newLocation, oldLocation) &&
      _.isEqual(props.match, prevProps.match)
    ) {
      return;
    }
    // two way data binding :-/
    const { pathname } = props.location;
    store.dispatch(UIActions.setCurrentLocation(pathname));
    analyticsSvc.route(pathname);
  }
  componentWillUnmount() {
    this.scrollable.removeEventListener('scroll', this._handleScroll);
    window.removeEventListener('resize', this._handleCondensedHeader);
  }
  _handleScroll(e){
    if (this._isDesktop()){
      window.requestAnimationFrame(() => {
        const header = document.querySelector('.pf-l-page__header');
        const main = e.target;
        const scrollingDistance = 20;
        const condensedHeaderHeightOffset = 50; //the difference in condensed header height
        const scrollPosition = main.scrollTop;

        //prevent jank caused by offset of scroll height and the client height of the scrolled content
        //compared with difference in our desktop condensed header height + the scrolling distance
        if ((main.scrollHeight - main.clientHeight) < condensedHeaderHeightOffset + scrollingDistance){
          return;
        }
        if (scrollPosition > scrollingDistance && header.classList.contains('pf-m-tall')) {
          header.classList.remove('pf-m-tall');
        } else if (scrollPosition < scrollingDistance && !header.classList.contains('pf-m-tall')) {
          header.classList.add('pf-m-tall');
        }
      });
    }
  }
  _isDesktop() {
    return typeof window !== 'undefined' && window.innerWidth >= parseInt(breakpointMd.value, 10);
  }
  _handleCondensedHeader(){
    const header = document.querySelector('.pf-l-page__header');
    if (this._isDesktop()){
      if (!header.classList.contains('pf-m-tall')){
        header.classList.add('pf-m-tall');
      }
    } else {
      header.classList.remove('pf-m-tall');
    }
  }
  _onNavToggle() {
    this.setState(prevState => {
      return {
        isNavOpen: !prevState.isNavOpen,
      };
    });
  }
  _onNavSelect() {
    //close nav on mobile nav selects
    if (!this._isDesktop()){
      this.setState({isNavOpen: false});
    }
  }

  render() {
    const bgImages = {
      [BackgroundImageSrc.lg]: pfBg1200,
      [BackgroundImageSrc.md]: pfBg992,
      [BackgroundImageSrc.md2x]: pfBg992R2x,
      [BackgroundImageSrc.sm]: pfBg768,
      [BackgroundImageSrc.sm2x]: pfBg768R2x,
      [BackgroundImageSrc.xl]: pfBg2000,
      [BackgroundImageSrc.xs]: pfBg576,
      [BackgroundImageSrc.xs2x]: pfBg576R2x,
      [BackgroundImageSrc.filter]: `${bgFilter}#image_overlay`,
    };
    const { isNavOpen } = this.state;

    return (
      <React.Fragment>
        <Helmet
          titleTemplate={`%s · ${productName}`}
          defaultTitle={productName}
        />
        <BackgroundImage src={bgImages} />
        <Page
          header={<AppHeader onNavToggle={this._onNavToggle} />}
          sidebar={<AppNav isNavOpen={isNavOpen} onNavSelect={this._onNavSelect} />}
        >
          <PageSection
            variant={PageSectionVariants.light}
            style={{ padding: 0 }}
          >
            <div id="content">
              <Route path={namespacedRoutes} component={NamespaceBar} />
              <GlobalNotifications />
              <div id="content-scrollable">
                <Switch>
                  <Route path={['/all-namespaces', '/ns/:ns']} component={RedirectComponent} />

                  <LazyRoute path="/overview/all-namespaces" exact loader={() => import('./cluster-overview' /* webpackChunkName: "cluster-overview" */).then(m => m.ClusterOverviewPage)} />
                  <LazyRoute path="/overview/ns/:ns" exact loader={() => import('./overview' /* webpackChunkName: "overview" */).then(m => m.OverviewPage)} />
                  <Route path="/overview" exact component={NamespaceRedirect} />

                  <LazyRoute path="/catalog/all-namespaces" exact loader={() => import('./catalog/catalog-page' /* webpackChunkName: "catalog" */).then(m => m.CatalogPage)} />
                  <LazyRoute path="/catalog/ns/:ns" exact loader={() => import('./catalog/catalog-page' /* webpackChunkName: "catalog" */).then(m => m.CatalogPage)} />
                  <Route path="/catalog" exact component={NamespaceRedirect} />

                  <LazyRoute path="/status/all-namespaces" exact loader={() => import('./cluster-overview' /* webpackChunkName: "cluster-overview" */).then(m => m.ClusterOverviewPage)} />
                  <LazyRoute path="/status/ns/:ns" exact loader={() => import('./cluster-overview' /* webpackChunkName: "cluster-overview" */).then(m => m.ClusterOverviewPage)} />
                  <Route path="/status" exact component={NamespaceRedirect} />

                  <LazyRoute path="/cluster-health" exact loader={() => import('./cluster-health' /* webpackChunkName: "cluster-health" */).then(m => m.ClusterHealth)} />
                  <LazyRoute path="/start-guide" exact loader={() => import('./start-guide' /* webpackChunkName: "start-guide" */).then(m => m.StartGuidePage)} />

                  <LazyRoute path="/marketplace" exact loader={() => import('./marketplace/kubernetes-marketplace' /* webpackChunkName: "marketplace" */).then(m => m.MarketplacePage)} />

                  <LazyRoute path={`/k8s/ns/:ns/${SubscriptionModel.plural}/new`} exact loader={() => import('./operator-lifecycle-manager' /* webpackChunkName: "create-subscription-yaml" */).then(m => NamespaceFromURL(m.CreateSubscriptionYAML))} />

                  <LazyRoute path="/catalog/create-service-instance" exact loader={() => import('./service-catalog/create-instance' /* webpackChunkName: "create-service-instance" */).then(m => m.CreateInstancePage)} />
                  <LazyRoute path="/k8s/ns/:ns/serviceinstances/:name/create-binding" exact loader={() => import('./service-catalog/create-binding' /* webpackChunkName: "create-binding" */).then(m => m.CreateBindingPage)} />
                  <LazyRoute path="/catalog/source-to-image" exact loader={() => import('./source-to-image' /* webpackChunkName: "source-to-image" */).then(m => m.SourceToImagePage)} />

                  <Route path="/k8s/ns/:ns/alertmanagers/:name" exact render={({match}) => <Redirect to={`/k8s/ns/${match.params.ns}/${referenceForModel(AlertmanagerModel)}/${match.params.name}`} />} />

                  <LazyRoute path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:name/edit`} exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => m.EditYAMLPage)} kind={referenceForModel(ClusterServiceVersionModel)} />
                  <LazyRoute path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/new`} exact loader={() => import('./operator-lifecycle-manager/create-crd-yaml' /* webpackChunkName: "create-crd-yaml" */).then(m => m.CreateCRDYAML)} />
                  <Route path={`/k8s/ns/:ns/${ClusterServiceVersionModel.plural}/:appName/:plural/:name`} component={ResourceDetailsPage} />

                  <LazyRoute path="/k8s/all-namespaces/events" exact loader={() => import('./events' /* webpackChunkName: "events" */).then(m => NamespaceFromURL(m.EventStreamPage))} />
                  <LazyRoute path="/k8s/ns/:ns/events" exact loader={() => import('./events' /* webpackChunkName: "events" */).then(m => NamespaceFromURL(m.EventStreamPage))} />
                  <Route path="/search/all-namespaces" exact component={NamespaceFromURL(SearchPage)} />
                  <Route path="/search/ns/:ns" exact component={NamespaceFromURL(SearchPage)} />
                  <Route path="/search" exact component={NamespaceRedirect} />

                  <LazyRoute path="/k8s/all-namespaces/import" exact loader={() => import('./import-yaml' /* webpackChunkName: "import-yaml" */).then(m => NamespaceFromURL(m.ImportYamlPage))} />
                  <LazyRoute path="/k8s/ns/:ns/import/" exact loader={() => import('./import-yaml' /* webpackChunkName: "import-yaml" */).then(m => NamespaceFromURL(m.ImportYamlPage))} />

                  <Route path="/k8s/ns/:ns/customresourcedefinitions/:plural" exact component={ResourceListPage} />
                  <Route path="/k8s/ns/:ns/customresourcedefinitions/:plural/:name" component={ResourceDetailsPage} />
                  <Route path="/k8s/all-namespaces/customresourcedefinitions/:plural" exact component={ResourceListPage} />
                  <Route path="/k8s/all-namespaces/customresourcedefinitions/:plural/:name" component={ResourceDetailsPage} />

                  {
                    // These pages are temporarily disabled. We need to update the safe resources list.
                    // <LazyRoute path="/k8s/cluster/clusterroles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                    // <LazyRoute path="/k8s/cluster/clusterroles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                  }

                  {
                    // <LazyRoute path="/k8s/ns/:ns/roles/:name/add-rule" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                    // <LazyRoute path="/k8s/ns/:ns/roles/:name/:rule/edit" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRulePage)} />
                  }

                  <LazyRoute path="/deploy-image" exact loader={() => import('./deploy-image').then(m => m.DeployImage)} />

                  <LazyRoute path="/k8s/ns/:ns/secrets/new/:type" exact kind="Secret" loader={() => import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(m => m.CreateSecret)} />
                  <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit" exact kind="Secret" loader={() => import('./secrets/create-secret' /* webpackChunkName: "create-secret" */).then(m => m.EditSecret)} />
                  <LazyRoute path="/k8s/ns/:ns/secrets/:name/edit-yaml" exact kind="Secret" loader={() => import('./create-yaml').then(m => m.EditYAMLPage)} />

                  <LazyRoute path="/k8s/ns/:ns/routes/new/form" exact kind="Route" loader={() => import('./routes/create-route' /* webpackChunkName: "create-route" */).then(m => m.CreateRoute)} />

                  <LazyRoute path="/k8s/cluster/rolebindings/new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
                  <LazyRoute path="/k8s/ns/:ns/rolebindings/new" exact loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CreateRoleBinding)} kind="RoleBinding" />
                  <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/copy" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
                  <LazyRoute path="/k8s/ns/:ns/rolebindings/:name/edit" exact kind="RoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />
                  <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/copy" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.CopyRoleBinding)} />
                  <LazyRoute path="/k8s/cluster/clusterrolebindings/:name/edit" exact kind="ClusterRoleBinding" loader={() => import('./RBAC' /* webpackChunkName: "rbac" */).then(m => m.EditRoleBinding)} />
                  <LazyRoute path="/k8s/ns/:ns/:plural/:name/attach-storage" exact loader={() => import('./storage/attach-storage' /* webpackChunkName: "attach-storage" */).then(m => m.AttachStorage)} />

                  <LazyRoute path="/k8s/ns/:ns/persistentvolumeclaims/new/form" exact kind="PersistentVolumeClaim" loader={() => import('./storage/create-pvc' /* webpackChunkName: "create-pvc" */).then(m => m.CreatePVC)} />

                  <Route path="/monitoring" component={MonitoringUI} />

                  <Route path="/settings/cluster" component={ClusterSettingsPage} />

                  <LazyRoute path={'/k8s/cluster/storageclasses/new/form'} exact loader={() => import('./storage-class-form' /* webpackChunkName: "storage-class-form" */).then(m => m.StorageClassForm)} />

                  <Route path="/k8s/cluster/:plural" exact component={ResourceListPage} />
                  <LazyRoute path="/k8s/cluster/:plural/new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => m.CreateYAML)} />
                  <Route path="/k8s/cluster/:plural/:name" component={ResourceDetailsPage} />
                  <LazyRoute path="/k8s/ns/:ns/pods/:podName/containers/:name" loader={() => import('./container').then(m => m.ContainersDetailsPage)} />
                  <LazyRoute path="/k8s/ns/:ns/:plural/new" exact loader={() => import('./create-yaml' /* webpackChunkName: "create-yaml" */).then(m => NamespaceFromURL(m.CreateYAML))} />
                  <Route path="/k8s/ns/:ns/:plural/:name" component={ResourceDetailsPage} />
                  <Route path="/k8s/ns/:ns/:plural" exact component={ResourceListPage} />

                  <Route path="/k8s/all-namespaces/:plural" exact component={ResourceListPage} />
                  <Route path="/k8s/all-namespaces/:plural/:name" component={ResourceDetailsPage} />

                  <LazyRoute path="/error" exact loader={() => import('./error' /* webpackChunkName: "error" */).then(m => m.ErrorPage)} />
                  <Route path="/" exact component={DefaultPage} />

                  <LazyRoute loader={() => import('./error' /* webpackChunkName: "error" */).then(m => m.ErrorPage404)} />
                </Switch>
              </div>
            </div>
          </PageSection>
        </Page>
      </React.Fragment>
    );
  }
}

const startDiscovery = () => store.dispatch(k8sActions.watchAPIServices());

// Load cached API resources from localStorage to speed up page load.
getCachedResources().then(resources => {
  if (resources) {
    store.dispatch({type: types.resources, resources});
  }
  // Still perform discovery to refresh the cache.
  startDiscovery();
}).catch(startDiscovery);

_.each(featureActions, store.dispatch);

analyticsSvc.push({tier: 'tectonic'});

// Used by GUI tests to check for unhandled exceptions
window.windowError = false;

window.onerror = function(message, source, lineno, colno, optError={}) {
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

window.onunhandledrejection = function(e) {
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
    navigator.serviceWorker
      .getRegistrations()
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
