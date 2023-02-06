import * as _ from 'lodash-es';
import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { linkify } from 'react-linkify';
import { Provider, useSelector } from 'react-redux';
import { Route, Router, Switch } from 'react-router-dom';
// AbortController is not supported in some older browser versions
import 'abort-controller/polyfill';
import store, { applyReduxExtensions } from '../redux';
import { withTranslation, useTranslation } from 'react-i18next';
import { coFetchJSON, appInternalFetch } from '../co-fetch';

import { detectFeatures } from '../actions/features';
import AppContents from './app-contents';
import { getBrandingDetails, Masthead } from './masthead';
import { ConsoleNotifier } from './console-notifier';
import { ConnectedNotificationDrawer } from './notification-drawer';
import { Navigation } from '@console/app/src/components/nav';
import { history, AsyncComponent, LoadingBox, useSafeFetch, usePoll } from './utils';
import * as UIActions from '../actions/ui';
import { fetchSwagger, getCachedResources } from '../module/k8s';
import { receivedResources, startAPIDiscovery } from '../actions/k8s';
import { pluginStore } from '../plugins';
// cloud shell imports must come later than features
import CloudShell from '@console/app/src/components/cloud-shell/CloudShell';
import CloudShellTab from '@console/app/src/components/cloud-shell/CloudShellTab';
import DetectPerspective from '@console/app/src/components/detect-perspective/DetectPerspective';
import DetectCluster from '@console/app/src/components/detect-cluster/DetectCluster';
import DetectNamespace from '@console/app/src/components/detect-namespace/DetectNamespace';
import DetectLanguage from '@console/app/src/components/detect-language/DetectLanguage';
import FeatureFlagExtensionLoader from '@console/app/src/components/flags/FeatureFlagExtensionLoader';
import { useExtensions } from '@console/plugin-sdk';
import {
  useResolvedExtensions,
  isContextProvider,
  isReduxReducer,
  isStandaloneRoutePage,
  AppInitSDK,
  getUser,
} from '@console/dynamic-plugin-sdk';
import { initConsolePlugins } from '@console/dynamic-plugin-sdk/src/runtime/plugin-init';
import { GuidedTour } from '@console/app/src/components/tour';
import QuickStartDrawer from '@console/app/src/components/quick-starts/QuickStartDrawerAsync';
import { ModalProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { settleAllPromises } from '@console/dynamic-plugin-sdk/src/utils/promise';
import ToastProvider from '@console/shared/src/components/toast/ToastProvider';
import { useToast } from '@console/shared/src/components/toast';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useDebounceCallback } from '@console/shared/src/hooks/debounce';
import { URL_POLL_DEFAULT_DELAY } from '@console/internal/components/utils/url-poll-hook';
import { ThemeProvider } from './ThemeProvider';
import { init as initI18n } from '../i18n';
import { Page, SkipToContent, AlertVariant } from '@patternfly/react-core'; // PF4 Imports
import '../vendor.scss';
import '../style.scss';
import '@patternfly/quickstarts/dist/quickstarts.min.css';
// load dark theme here as MiniCssExtractPlugin ignores load order of sass and dark theme must load after all other css
import '@patternfly/patternfly/patternfly-charts-theme-dark.css';

const breakpointMD = 1200;
const NOTIFICATION_DRAWER_BREAKPOINT = 1800;
// Edge lacks URLSearchParams
import 'url-search-params-polyfill';
import { withoutSensitiveInformations } from './utils/telemetry';
import { graphQLReady } from '../graphql/client';

initI18n();

// Disable linkify 'fuzzy links' across the app.
// Only linkify url strings beginning with a proper protocol scheme.
linkify.set({ fuzzyLink: false });

const EnhancedProvider = ({ provider: ContextProvider, useValueHook, children }) => {
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
        <ConsoleNotifier location="BannerTop" />
        <QuickStartDrawer>
          <div id="app-content" className="co-m-app__content">
            <Page
              // Need to pass mainTabIndex=null to enable keyboard scrolling as default tabIndex is set to -1 by patternfly
              mainTabIndex={null}
              header={<Masthead isNavOpen={isNavOpen} onNavToggle={this._onNavToggle} />}
              sidebar={
                <Navigation
                  isNavOpen={isNavOpen}
                  onNavSelect={this._onNavSelect}
                  onPerspectiveSelected={this._onNavSelect}
                />
              }
              skipToContent={
                <SkipToContent
                  href={`${this.props.location.pathname}${this.props.location.search}#content`}
                >
                  Skip to Content
                </SkipToContent>
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
          </div>
          <div id="modal-container" role="dialog" aria-modal="true" />
        </QuickStartDrawer>
        <ConsoleNotifier location="BannerBottom" />
        <FeatureFlagExtensionLoader />
      </>
    );

    return (
      <DetectPerspective>
        <DetectNamespace>
          <DetectCluster>
            <ModalProvider>
              {contextProviderExtensions.reduce(
                (children, e) => (
                  <EnhancedProvider key={e.uid} {...e.properties}>
                    {children}
                  </EnhancedProvider>
                ),
                content,
              )}
            </ModalProvider>
          </DetectCluster>
        </DetectNamespace>
        <DetectLanguage />
      </DetectPerspective>
    );
  }
}

const AppWithExtensions = withTranslation()(function AppWithExtensions(props) {
  const [reduxReducerExtensions, reducersResolved] = useResolvedExtensions(isReduxReducer);
  const [contextProviderExtensions, providersResolved] = useResolvedExtensions(isContextProvider);

  if (reducersResolved && providersResolved) {
    applyReduxExtensions(reduxReducerExtensions);
    return <App_ contextProviderExtensions={contextProviderExtensions} {...props} />;
  }

  return <LoadingBox />;
});

render(<LoadingBox />, document.getElementById('app'));

const AppRouter = () => {
  const standaloneRouteExtensions = useExtensions(isStandaloneRoutePage);
  return (
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <Switch>
        {standaloneRouteExtensions.map((e) => (
          <Route
            key={e.uid}
            render={(componentProps) => (
              <AsyncComponent loader={e.properties.component} {...componentProps} />
            )}
            path={e.properties.path}
            exact={e.properties.exact}
          />
        ))}
        <Route path="/terminal" component={CloudShellTab} />
        <Route path="/" component={AppWithExtensions} />
      </Switch>
    </Router>
  );
};

const CaptureTelemetry = React.memo(function CaptureTelemetry() {
  const fireTelemetryEvent = useTelemetry();

  // notify of identity change
  const user = useSelector(getUser);
  React.useEffect(() => {
    if (user.metadata?.uid || user.metadata?.name) {
      fireTelemetryEvent('identify', { user });
    }
    // Only trigger identify event when the user identifier changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.metadata?.uid || user.metadata?.name, fireTelemetryEvent]);

  // notify url change events
  // Debouncing the url change events so that redirects don't fire multiple events.
  // Also because some pages update the URL as the user enters a search term.
  const fireUrlChangeEvent = useDebounceCallback(fireTelemetryEvent);
  React.useEffect(() => {
    fireUrlChangeEvent('page', withoutSensitiveInformations(history.location));

    let { pathname, search } = history.location;
    const unlisten = history.listen((location) => {
      const { pathname: nextPathname, search: nextSearch } = history.location;
      if (pathname !== nextPathname || search !== nextSearch) {
        pathname = nextPathname;
        search = nextSearch;
        fireUrlChangeEvent('page', withoutSensitiveInformations(location));
      }
    });
    return () => unlisten();
  }, [fireUrlChangeEvent]);

  return null;
});

const PollConsoleUpdates = React.memo(function PollConsoleUpdates() {
  const toastContext = useToast();
  const { t } = useTranslation();

  const [isToastOpen, setToastOpen] = React.useState(false);
  const [pluginsChanged, setPluginsChanged] = React.useState(false);
  const [pluginVersionsChanged, setPluginVersionsChanged] = React.useState(false);
  const [consoleChanged, setConsoleChanged] = React.useState(false);
  const [isFetchingPluginEndpoints, setIsFetchingPluginEndpoints] = React.useState(false);
  const [allPluginEndpointsReady, setAllPluginEndpointsReady] = React.useState(false);

  const [updateData, setUpdateData] = React.useState();
  const [updateError, setUpdateError] = React.useState();
  const [pluginManifestsData, setPluginManifestsData] = React.useState();
  const safeFetch = React.useCallback(useSafeFetch(), []);
  const fetchPluginManifest = (pluginName) =>
    coFetchJSON(
      `${window.SERVER_FLAGS.basePath}api/plugins/${pluginName}/plugin-manifest.json`,
      'get',
      { cache: 'no-cache' },
    );
  const tick = React.useCallback(() => {
    safeFetch(`${window.SERVER_FLAGS.basePath}api/check-updates`)
      .then((response) => {
        setUpdateData(response);
        setUpdateError(null);
        const pluginManifests = response?.plugins?.map((pluginName) =>
          fetchPluginManifest(pluginName),
        );
        if (pluginManifests) {
          settleAllPromises(pluginManifests).then(([fulfilledValues]) => {
            setPluginManifestsData(fulfilledValues);
          });
        }
      })
      .catch(setUpdateError);
  }, [safeFetch]);
  usePoll(tick, URL_POLL_DEFAULT_DELAY);

  const prevUpdateDataRef = React.useRef();
  const prevPluginManifestsDataRef = React.useRef();
  React.useEffect(() => {
    prevUpdateDataRef.current = updateData;
    prevPluginManifestsDataRef.current = pluginManifestsData;
  });
  const prevUpdateData = prevUpdateDataRef.current;
  const prevPluginManifestsData = prevPluginManifestsDataRef.current;
  const stateInitialized = _.isEmpty(updateError) && !_.isEmpty(prevUpdateData);

  const pluginsListChanged = !_.isEmpty(_.xor(prevUpdateData?.plugins, updateData?.plugins));
  if (stateInitialized && pluginsListChanged && !pluginsChanged) {
    setPluginsChanged(true);
  }

  if (pluginsChanged && !allPluginEndpointsReady && !isFetchingPluginEndpoints) {
    const pluginEndpointsReady = updateData?.plugins?.map((pluginName) =>
      fetchPluginManifest(pluginName),
    );
    Promise.all(pluginEndpointsReady)
      .then(() => {
        setAllPluginEndpointsReady(true);
        setIsFetchingPluginEndpoints(false);
      })
      .catch(() => {
        setAllPluginEndpointsReady(false);
        setTimeout(() => setIsFetchingPluginEndpoints(false), URL_POLL_DEFAULT_DELAY);
      });
    setIsFetchingPluginEndpoints(true);
  }

  const pluginManifestsVersionsChanged = pluginManifestsData?.some((manifest) => {
    return prevPluginManifestsData?.some((previousManifest) => {
      return (
        manifest.name === previousManifest.name && manifest.version !== previousManifest.version
      );
    });
  });
  if (
    stateInitialized &&
    !_.isEmpty(prevPluginManifestsData) &&
    pluginManifestsVersionsChanged &&
    !pluginVersionsChanged
  ) {
    setPluginVersionsChanged(true);
  }

  const consoleCommitChanged = prevUpdateData?.consoleCommit !== updateData?.consoleCommit;
  if (stateInitialized && consoleCommitChanged && !consoleChanged) {
    setConsoleChanged(true);
  }

  const managedClustersChanged = !_.isEmpty(
    _.xor(prevUpdateData?.managedClusters, updateData?.managedClusters),
  );
  if (stateInitialized && managedClustersChanged && !consoleChanged) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] MANGED CLUSTERS UPDATED');
    setConsoleChanged(true);
  }

  if (isToastOpen || !stateInitialized) {
    return null;
  }

  if (!pluginsChanged && !pluginVersionsChanged && !consoleChanged) {
    return null;
  }

  if (pluginsChanged && !allPluginEndpointsReady) {
    return null;
  }

  const toastCallback = () => {
    setToastOpen(false);
    setPluginsChanged(false);
    setPluginVersionsChanged(false);
    setConsoleChanged(false);
    setAllPluginEndpointsReady(false);
    setIsFetchingPluginEndpoints(false);
  };

  toastContext.addToast({
    variant: AlertVariant.warning,
    title: t('public~Web console update is available'),
    content: t(
      'public~There has been an update to the web console. Ensure any changes have been saved and refresh your browser to access the latest version.',
    ),
    timeout: false,
    dismissible: true,
    actions: [
      {
        dismiss: true,
        label: t('public~Refresh web console'),
        callback: () => {
          if (window.location.pathname.includes('/operatorhub/subscribe')) {
            window.location.href = '/operatorhub';
          } else {
            window.location.reload();
          }
        },
        dataTest: 'refresh-web-console',
      },
    ],
    onClose: toastCallback,
    onRemove: toastCallback,
  });

  setToastOpen(true);
  return null;
});

let updateSwaggerInterval;

/**
 * Fetch OpenAPI definitions immediately upon application start and
 * then poll swagger definitions every 5 minutes to ensure they stay up to date.
 */
const updateSwaggerDefinitionContinual = () => {
  fetchSwagger().catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Could not fetch OpenAPI after application start:', e);
  });
  clearInterval(updateSwaggerInterval);
  updateSwaggerInterval = setInterval(() => {
    fetchSwagger().catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Could not fetch OpenAPI to stay up to date:', e);
    });
  }, 5 * 60 * 1000);
};

const initPlugins = (storeInstance) => {
  return initConsolePlugins(pluginStore, storeInstance);
};
// Load cached API resources from localStorage to speed up page load.
const initApiDiscovery = (storeInstance) => {
  getCachedResources()
    .then((resources) => {
      if (resources) {
        storeInstance.dispatch(receivedResources(resources));
      }
      // Still perform discovery to refresh the cache.
      storeInstance.dispatch(startAPIDiscovery());
    })
    .catch(() => storeInstance.dispatch(startAPIDiscovery()));
  updateSwaggerDefinitionContinual();
};

graphQLReady.onReady(() => {
  store.dispatch(detectFeatures());

  // Global timer to ensure all <Timestamp> components update in sync
  setInterval(() => store.dispatch(UIActions.updateTimestamps(Date.now())), 10000);

  // Used by GUI tests to check for unhandled exceptions
  window.windowError = null;
  window.onerror = (message, source, lineno, colno, error) => {
    const formattedStack = error?.stack?.replace(/\\n/g, '\n');
    const formattedMessage = `unhandled error: ${message} ${formattedStack || ''}`;
    window.windowError = formattedMessage;
    // eslint-disable-next-line no-console
    console.error(formattedMessage, error || message);
  };
  window.onunhandledrejection = (promiseRejectionEvent) => {
    const { reason } = promiseRejectionEvent;
    const formattedMessage = `unhandled promise rejection: ${reason}`;
    window.windowError = formattedMessage;
    // eslint-disable-next-line no-console
    console.error(formattedMessage, reason);
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
        <ThemeProvider>
          <AppInitSDK
            configurations={{
              appFetch: appInternalFetch,
              apiDiscovery: initApiDiscovery,
              initPlugins,
            }}
          >
            <CaptureTelemetry />
            <ToastProvider>
              <PollConsoleUpdates />
              <AppRouter />
            </ToastProvider>
          </AppInitSDK>
        </ThemeProvider>
      </Provider>
    </React.Suspense>,
    document.getElementById('app'),
  );
});
