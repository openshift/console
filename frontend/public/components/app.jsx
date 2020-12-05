import * as _ from 'lodash-es';
import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { linkify } from 'react-linkify';
import { Provider } from 'react-redux';
import { Route, Router, Switch } from 'react-router-dom';
// AbortController is not supported in some older browser versions
import 'abort-controller/polyfill';
import store from '../redux';
import { withTranslation } from 'react-i18next';

import { detectFeatures } from '../actions/features';
import AppContents from './app-contents';
import { getBrandingDetails, Masthead } from './masthead';
import { ConsoleNotifier } from './console-notifier';
import { ConnectedNotificationDrawer } from './notification-drawer';
import { Navigation } from './nav';
import { history, AsyncComponent, LoadingBox } from './utils';
import * as UIActions from '../actions/ui';
import { fetchSwagger, getCachedResources } from '../module/k8s';
import { receivedResources, watchAPIServices } from '../actions/k8s';
import { initConsolePlugins } from '../plugins';
// cloud shell imports must come later than features
import CloudShell from '@console/app/src/components/cloud-shell/CloudShell';
import CloudShellTab from '@console/app/src/components/cloud-shell/CloudShellTab';
import DetectPerspective from '@console/app/src/components/detect-perspective/DetectPerspective';
import DetectNamespace from '@console/app/src/components/detect-namespace/DetectNamespace';
import { withExtensions, isContextProvider } from '@console/plugin-sdk';
import { GuidedTour } from '@console/app/src/components/tour';

const consoleLoader = () =>
  import(
    '@console/kubevirt-plugin/src/components/connected-vm-console/vm-console-page' /* webpackChunkName: "kubevirt" */
  ).then((m) => m.VMConsolePage);
import QuickStartDrawer from '@console/app/src/components/quick-starts/QuickStartDrawer';
import '../i18n';
import '../vendor.scss';
import '../style.scss';

//PF4 Imports
import { Page } from '@patternfly/react-core';

const breakpointMD = 768;
const NOTIFICATION_DRAWER_BREAKPOINT = 1800;
// Edge lacks URLSearchParams
import 'url-search-params-polyfill';
import { graphQLReady } from '../graphql/client';

// Disable linkify 'fuzzy links' across the app.
// Only linkify url strings beginning with a proper protocol scheme.
linkify.set({ fuzzyLink: false });

const EnhancedProvider = ({ Provider: ContextProvider, useValueHook, children }) => {
  const value = useValueHook();
  return <ContextProvider value={value}>{children}</ContextProvider>;
};

class App_ extends React.PureComponent {
  constructor(props) {
    super(props);

    this._onNavToggle = this._onNavToggle.bind(this);
    this._onNavSelect = this._onNavSelect.bind(this);
    this._onNotificationDrawerToggle = this._onNotificationDrawerToggle.bind(this);
    this._isDesktop = this._isDesktop.bind(this);
    this._onResize = this._onResize.bind(this);
    this.previousDesktopState = this._isDesktop();
    this.previousDrawerInlineState = this._isLargeLayout();

    this.state = {
      isNavOpen: this._isDesktop(),
      isDrawerInline: this._isLargeLayout(),
    };
  }

  UNSAFE_componentWillMount() {
    window.addEventListener('resize', this._onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize);
  }

  componentDidUpdate(prevProps) {
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
  }

  _isLargeLayout() {
    return window.innerWidth >= NOTIFICATION_DRAWER_BREAKPOINT;
  }

  _isDesktop() {
    return window.innerWidth >= breakpointMD;
  }

  _onNavToggle() {
    // Some components, like svg charts, need to reflow when nav is toggled.
    // Fire event after a short delay to allow nav animation to complete.
    setTimeout(() => {
      window.dispatchEvent(new Event('sidebar_toggle'));
    }, 100);

    this.setState((prevState) => {
      return {
        isNavOpen: !prevState.isNavOpen,
      };
    });
  }

  _onNotificationDrawerToggle() {
    if (this._isLargeLayout()) {
      // Fire event after the drawer animation speed delay.
      setTimeout(() => {
        window.dispatchEvent(new Event('sidebar_toggle'));
      }, 250);
    }
  }

  _onNavSelect() {
    //close nav on mobile nav selects
    if (!this._isDesktop()) {
      this.setState({ isNavOpen: false });
    }
  }

  _onResize() {
    const isDesktop = this._isDesktop();
    const isDrawerInline = this._isLargeLayout();
    if (this.previousDesktopState !== isDesktop) {
      this.setState({ isNavOpen: isDesktop });
      this.previousDesktopState = isDesktop;
    }
    if (this.previousDrawerInlineState !== isDrawerInline) {
      this.setState({ isDrawerInline });
      this.previousDrawerInlineState = isDrawerInline;
    }
  }

  render() {
    const { isNavOpen, isDrawerInline } = this.state;
    const { contextProviderExtensions } = this.props;
    const { productName } = getBrandingDetails();

    const content = (
      <>
        <Helmet titleTemplate={`%s · ${productName}`} defaultTitle={productName} />
        <QuickStartDrawer>
          <ConsoleNotifier location="BannerTop" />
          <Page
            header={<Masthead onNavToggle={this._onNavToggle} />}
            sidebar={
              <Navigation
                isNavOpen={isNavOpen}
                onNavSelect={this._onNavSelect}
                onPerspectiveSelected={this._onNavSelect}
              />
            }
          >
            <ConnectedNotificationDrawer
              isDesktop={isDrawerInline}
              onDrawerChange={this._onNotificationDrawerToggle}
            >
              <AppContents />
            </ConnectedNotificationDrawer>
          </Page>
          <CloudShell />
          <GuidedTour />
          <ConsoleNotifier location="BannerBottom" />
        </QuickStartDrawer>
        <div id="modal-container" role="dialog" aria-modal="true" />
      </>
    );

    return (
      <DetectPerspective>
        <DetectNamespace>
          {contextProviderExtensions.reduce(
            (children, e) => (
              <EnhancedProvider key={e.uid} {...e.properties}>
                {children}
              </EnhancedProvider>
            ),
            content,
          )}
        </DetectNamespace>
      </DetectPerspective>
    );
  }
}

initConsolePlugins(store);

const App = withExtensions({ contextProviderExtensions: isContextProvider })(App_);

render(<LoadingBox />, document.getElementById('app'));

const AppWithTranslation = withTranslation()(App);

graphQLReady.onReady(() => {
  const startDiscovery = () => store.dispatch(watchAPIServices());

  // Load cached API resources from localStorage to speed up page load.
  getCachedResources()
    .then((resources) => {
      if (resources) {
        store.dispatch(receivedResources(resources));
      }
      // Still perform discovery to refresh the cache.
      startDiscovery();
    })
    .catch(startDiscovery);

  store.dispatch(detectFeatures());

  // Global timer to ensure all <Timestamp> components update in sync
  setInterval(() => store.dispatch(UIActions.updateTimestamps(Date.now())), 10000);

  // Fetch swagger definitions immediately upon application start
  fetchSwagger();
  // then poll swagger definitions every 5 minutes to ensure they stay up to date
  setInterval(fetchSwagger, 5 * 60 * 1000);

  // Used by GUI tests to check for unhandled exceptions
  window.windowError = null;
  window.onerror = (message, source, lineno, colno, error) => {
    const { stack } = error;
    const formattedStack = stack?.replace(/\\n/g, '\n');
    window.windowError = `unhandled error: ${message} ${formattedStack || ''}`;
    // eslint-disable-next-line no-console
    console.error(window.windowError);
  };
  window.onunhandledrejection = (promiseRejectionEvent) => {
    const { reason } = promiseRejectionEvent;
    window.windowError = `unhandled promise rejection: ${reason}`;
    // eslint-disable-next-line no-console
    console.error(window.windowError);
  };

  if ('serviceWorker' in navigator) {
    if (window.SERVER_FLAGS.loadTestFactor > 1) {
      // eslint-disable-next-line import/no-unresolved
      import('file-loader?name=load-test.sw.js!../load-test.sw.js')
        .then(() => navigator.serviceWorker.register('/load-test.sw.js'))
        .then(
          () =>
            new Promise((r) =>
              navigator.serviceWorker.controller
                ? r()
                : navigator.serviceWorker.addEventListener('controllerchange', () => r()),
            ),
        )
        .then(() =>
          navigator.serviceWorker.controller.postMessage({
            topic: 'setFactor',
            value: window.SERVER_FLAGS.loadTestFactor,
          }),
        );
    } else {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((reg) => reg.unregister()))
        // eslint-disable-next-line no-console
        .catch((e) => console.warn('Error unregistering service workers', e));
    }
  }

  render(
    <React.Suspense fallback={<LoadingBox />}>
      <Provider store={store}>
        <Router history={history} basename={window.SERVER_FLAGS.basePath}>
          <Switch>
            <Route
              path="/k8s/ns/:ns/virtualmachineinstances/:name/standaloneconsole"
              render={(componentProps) => (
                <AsyncComponent loader={consoleLoader} {...componentProps} />
              )}
            />
            <Route path="/terminal" component={CloudShellTab} />
            <Route path="/" component={AppWithTranslation} />
          </Switch>
        </Router>
      </Provider>
    </React.Suspense>,
    document.getElementById('app'),
  );
});
