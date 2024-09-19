/* eslint-disable @typescript-eslint/no-use-before-define */
import * as _ from 'lodash-es';
import * as React from 'react';
import { render } from 'react-dom';
import { Helmet } from 'react-helmet';
import { linkify } from 'react-linkify';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Router } from 'react-router-dom';
import { useParams, useLocation, CompatRouter, Routes, Route } from 'react-router-dom-v5-compat';
// AbortController is not supported in some older browser versions
import 'abort-controller/polyfill';
import store, { applyReduxExtensions } from '../redux';
import { useTranslation } from 'react-i18next';
import { coFetchJSON, appInternalFetch } from '../co-fetch';
import { detectFeatures } from '../actions/features';
import { setFlag } from '../actions/flags';
import AppContents from './app-contents';
import { Masthead } from './masthead';
import { getBrandingDetails } from './utils/branding';
import { ConsoleNotifier } from './console-notifier';
import { ConnectedNotificationDrawer } from './notification-drawer';
import { Navigation } from '@console/app/src/components/nav';
import { history, AsyncComponent, LoadingBox, useSafeFetch, usePoll } from './utils';
import * as UIActions from '../actions/ui';
import { fetchSwagger, getCachedResources } from '../module/k8s';
import { receivedResources, startAPIDiscovery } from '../actions/k8s';
import { pluginStore } from '../plugins';
// cloud shell imports must come later than features
import CloudShell from '@console/webterminal-plugin/src/components/cloud-shell/CloudShell';
import CloudShellTab from '@console/webterminal-plugin/src/components/cloud-shell/CloudShellTab';
import DetectPerspective from '@console/app/src/components/detect-perspective/DetectPerspective';
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
  useActivePerspective,
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
import { LOGIN_ERROR_PATH } from '@console/internal/module/auth';
import { URL_POLL_DEFAULT_DELAY } from '@console/internal/components/utils/url-poll-hook';
import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import Lightspeed from '@console/app/src/components/lightspeed/Lightspeed';
import { ThemeProvider } from './ThemeProvider';
import { init as initI18n } from '../i18n';
import { Page, SkipToContent, AlertVariant } from '@patternfly/react-core'; // PF4 Imports
import { AuthenticationErrorPage } from './error';
import '../vendor.scss';
import '../style.scss';
import '@patternfly/quickstarts/dist/quickstarts.min.css';
// load dark theme here as MiniCssExtractPlugin ignores load order of sass and dark theme must load after all other css
import '@patternfly/patternfly/patternfly-charts-theme-dark.css';

const PF_BREAKPOINT_MD = 768;
const PF_BREAKPOINT_XL = 1200;
const NOTIFICATION_DRAWER_BREAKPOINT = 1800;
// Edge lacks URLSearchParams
import 'url-search-params-polyfill';
import { withoutSensitiveInformations, getTelemetryTitle } from './utils/telemetry';
import { graphQLReady } from '../graphql/client';
import { AdmissionWebhookWarningNotifications } from '@console/app/src/components/admission-webhook-warnings/AdmissionWebhookWarningNotifications';
import { usePackageManifestCheck } from '@console/shared/src/hooks/usePackageManifestCheck';
import { useCSPViolationDetector } from '@console/app/src/hooks/useCSPVioliationDetector';

initI18n();

// Disable linkify 'fuzzy links' across the app.
// Only linkify url strings beginning with a proper protocol scheme.
linkify.set({ fuzzyLink: false });

const EnhancedProvider = ({ provider: ContextProvider, useValueHook, children }) => {
  const value = useValueHook();
  return <ContextProvider value={value}>{children}</ContextProvider>;
};

const App = (props) => {
  const { contextProviderExtensions } = props;

  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();

  const isLargeLayout = () => {
    return window.innerWidth >= NOTIFICATION_DRAWER_BREAKPOINT;
  };

  const isDesktop = () => {
    return window.innerWidth >= PF_BREAKPOINT_XL;
  };

  const isMobile = () => {
    return window.innerWidth < PF_BREAKPOINT_MD;
  };

  const [prevLocation, setPrevLocation] = React.useState(location);
  const [prevParams, setPrevParams] = React.useState(params);

  const [isMastheadStacked, setIsMastheadStacked] = React.useState(isMobile());
  const [isNavOpen, setIsNavOpen] = React.useState(isDesktop());
  const [isDrawerInline, setIsDrawerInline] = React.useState(isLargeLayout());

  const previousDesktopState = React.useRef(isDesktop());
  const previousMobileState = React.useRef(isMobile());
  const previousDrawerInlineState = React.useRef(isLargeLayout());

  const onResize = React.useCallback(() => {
    const desktop = isDesktop();
    const mobile = isMobile();
    const drawerInline = isLargeLayout();
    if (previousDesktopState.current !== desktop) {
      setIsNavOpen(desktop);
      previousDesktopState.current = desktop;
    }
    if (previousMobileState.current !== mobile) {
      setIsMastheadStacked(mobile);
      previousMobileState.current = mobile;
    }
    if (previousDrawerInlineState.current !== drawerInline) {
      setIsDrawerInline(drawerInline);
      previousDrawerInlineState.current = drawerInline;
    }
  }, []);

  useCSPViolationDetector();

  React.useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [onResize]);

  React.useLayoutEffect(() => {
    // Prevent infinite loop in case React Router decides to destroy & recreate the component (changing key)
    const oldLocation = _.omit(prevLocation, ['key']);
    const newLocation = _.omit(location, ['key']);
    if (_.isEqual(newLocation, oldLocation) && _.isEqual(params, prevParams)) {
      return;
    }
    const { pathname } = location;
    store.dispatch(UIActions.setCurrentLocation(pathname));
    setPrevLocation(location);
    setPrevParams(params);
  }, [location, params, prevLocation, prevParams]);

  const dispatch = useDispatch();
  const [, , errorMessage] = usePackageManifestCheck(
    'lightspeed-operator',
    'openshift-marketplace',
  );

  React.useEffect(() => {
    const lightspeedButtonCapability = window.SERVER_FLAGS?.capabilities?.find(
      (capability) => capability.name === 'LightspeedButton',
    );
    const gettingStartedBannerCapability = window.SERVER_FLAGS?.capabilities?.find(
      (capability) => capability.name === 'GettingStartedBanner',
    );
    dispatch(
      setFlag(
        FLAGS.CONSOLE_CAPABILITY_LIGHTSPEEDBUTTON_IS_ENABLED,
        lightspeedButtonCapability?.visibility?.state === 'Enabled',
      ),
    );
    dispatch(
      setFlag(
        FLAGS.CONSOLE_CAPABILITY_GETTINGSTARTEDBANNER_IS_ENABLED,
        gettingStartedBannerCapability?.visibility?.state === 'Enabled',
      ),
    );
    dispatch(setFlag(FLAGS.LIGHTSPEED_IS_AVAILABLE_TO_INSTALL, errorMessage === ''));
  }, [dispatch, errorMessage]);

  const consoleCapabilityLightspeedButtonIsEnabled = useFlag(
    FLAGS.CONSOLE_CAPABILITY_LIGHTSPEEDBUTTON_IS_ENABLED,
  );
  const lightspeedIsAvailableToInstall = useFlag(FLAGS.LIGHTSPEED_IS_AVAILABLE_TO_INSTALL);

  const onNavToggle = () => {
    // Some components, like svg charts, need to reflow when nav is toggled.
    // Fire event after a short delay to allow nav animation to complete.
    setTimeout(() => {
      window.dispatchEvent(new Event('sidebar_toggle'));
    }, 100);

    setIsNavOpen((prevState) => !prevState);
  };

  const onNotificationDrawerToggle = () => {
    if (isLargeLayout()) {
      // Fire event after the drawer animation speed delay.
      setTimeout(() => {
        window.dispatchEvent(new Event('sidebar_toggle'));
      }, 250);
    }
  };

  const onNavSelect = () => {
    //close nav on mobile nav selects
    if (!isDesktop()) {
      setIsNavOpen(false);
    }
  };

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
            className="pf-c-page" // legacy pf-c-page class needed for PF4 component styling
            header={
              <Masthead
                isNavOpen={isNavOpen}
                onNavToggle={onNavToggle}
                isMastheadStacked={isMastheadStacked}
              />
            }
            sidebar={
              <Navigation
                isNavOpen={isNavOpen}
                onNavSelect={onNavSelect}
                onPerspectiveSelected={onNavSelect}
              />
            }
            skipToContent={
              <SkipToContent href={`${location.pathname}${location.search}#content`}>
                Skip to Content
              </SkipToContent>
            }
          >
            <ConnectedNotificationDrawer
              isDesktop={isDrawerInline}
              onDrawerChange={onNotificationDrawerToggle}
            >
              <AppContents />
            </ConnectedNotificationDrawer>
          </Page>
          {consoleCapabilityLightspeedButtonIsEnabled && lightspeedIsAvailableToInstall && (
            <Lightspeed />
          )}
          <CloudShell />
          <GuidedTour />
        </div>
        <div id="modal-container" role="dialog" aria-modal="true" aria-label={t('public~Modal')} />
      </QuickStartDrawer>
      <ConsoleNotifier location="BannerBottom" />
      <FeatureFlagExtensionLoader />
    </>
  );

  return (
    <DetectPerspective>
      <CaptureTelemetry />
      <DetectNamespace>
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
      </DetectNamespace>
      <DetectLanguage />
    </DetectPerspective>
  );
};

const AppWithExtensions = (props) => {
  const [reduxReducerExtensions, reducersResolved] = useResolvedExtensions(isReduxReducer);
  const [contextProviderExtensions, providersResolved] = useResolvedExtensions(isContextProvider);

  if (reducersResolved && providersResolved) {
    applyReduxExtensions(reduxReducerExtensions);
    return <App contextProviderExtensions={contextProviderExtensions} {...props} />;
  }

  return <LoadingBox />;
};

render(<LoadingBox />, document.getElementById('app'));

const AppRouter = () => {
  const standaloneRouteExtensions = useExtensions(isStandaloneRoutePage);
  // Treat the authentication error page as a standalone route. There is no need to render the rest
  // of the app if we know authentication has failed.
  return (
    <Router history={history} basename={window.SERVER_FLAGS.basePath}>
      <CompatRouter>
        <Routes>
          <Route path={LOGIN_ERROR_PATH} component={AuthenticationErrorPage} />
          {standaloneRouteExtensions.map((e) => (
            <Route
              key={e.uid}
              element={<AsyncComponent loader={e.properties.component} />}
              path={`${e.properties.path}${e.properties.exact ? '' : '/*'}`}
            />
          ))}
          <Route path="/terminal/*" element={<CloudShellTab />} />
          <Route path="/*" element={<AppWithExtensions />} />
        </Routes>
      </CompatRouter>
    </Router>
  );
};

const CaptureTelemetry = React.memo(function CaptureTelemetry() {
  const [perspective] = useActivePerspective();
  const fireTelemetryEvent = useTelemetry();
  const [debounceTime, setDebounceTime] = React.useState(5000);
  const [titleOnLoad, setTitleOnLoad] = React.useState('');
  // notify of identity change
  const user = useSelector(getUser);
  const telemetryTitle = getTelemetryTitle();

  React.useEffect(
    () =>
      setTimeout(() => {
        setTitleOnLoad(telemetryTitle);
        setDebounceTime(500);
      }, 5000),
    [telemetryTitle],
  );

  React.useEffect(() => {
    if (user?.uid || user?.username) {
      fireTelemetryEvent('identify', { perspective, user });
    }
    // Only trigger identify event when the user identifier changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid || user?.username, fireTelemetryEvent]);

  // notify url change events
  // Debouncing the url change events so that redirects don't fire multiple events.
  // Also because some pages update the URL as the user enters a search term.
  const fireUrlChangeEvent = useDebounceCallback((location) => {
    fireTelemetryEvent('page', {
      perspective,
      title: getTelemetryTitle(),
      ...withoutSensitiveInformations(location),
    });
  }, debounceTime);
  React.useEffect(() => {
    if (!titleOnLoad) {
      return;
    }
    fireUrlChangeEvent(history.location);
    let { pathname, search } = history.location;
    const unlisten = history.listen((location) => {
      const { pathname: nextPathname, search: nextSearch } = history.location;
      if (pathname !== nextPathname || search !== nextSearch) {
        pathname = nextPathname;
        search = nextSearch;
        fireUrlChangeEvent(location);
      }
    });
    return () => unlisten();
  }, [perspective, fireUrlChangeEvent, titleOnLoad]);

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
  const [newPlugins, setNewPlugins] = React.useState();
  const [pluginManifestsData, setPluginManifestsData] = React.useState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const pluginsAddedList = updateData?.plugins.filter((x) => !prevUpdateData?.plugins.includes(x));
  const pluginsRemovedList = prevUpdateData?.plugins.filter(
    (x) => !updateData?.plugins.includes(x),
  );
  const pluginsAdded = !_.isEmpty(pluginsAddedList);
  const pluginsRemoved = !_.isEmpty(pluginsRemovedList);

  if (stateInitialized && pluginsAdded && !pluginsChanged) {
    setPluginsChanged(true);
    setNewPlugins(pluginsAddedList);
  }

  if (stateInitialized && pluginsRemoved && !consoleChanged) {
    setConsoleChanged(true);
  }

  if (pluginsChanged && !allPluginEndpointsReady && !isFetchingPluginEndpoints) {
    const pluginEndpointsReady =
      newPlugins?.map((pluginName) => fetchPluginManifest(pluginName)) ?? [];
    if (!_.isEmpty(pluginEndpointsReady)) {
      settleAllPromises(pluginEndpointsReady).then(([, rejectedReasons]) => {
        if (!_.isEmpty(rejectedReasons)) {
          setAllPluginEndpointsReady(false);
          setTimeout(() => setIsFetchingPluginEndpoints(false), URL_POLL_DEFAULT_DELAY);
          return;
        }
        setAllPluginEndpointsReady(true);
        setIsFetchingPluginEndpoints(false);
        setNewPlugins(null);
      });
      setIsFetchingPluginEndpoints(true);
    } else {
      setAllPluginEndpointsReady(true);
      setIsFetchingPluginEndpoints(false);
    }
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

  const consoleCapabilitiesChanged = !_.isEqual(
    prevUpdateData?.capabilities,
    updateData?.capabilities,
  );
  const consoleCommitChanged = prevUpdateData?.consoleCommit !== updateData?.consoleCommit;

  if (stateInitialized && (consoleCommitChanged || consoleCapabilitiesChanged) && !consoleChanged) {
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
  window.windowError = [];
  window.onerror = (message, source, lineno, colno, error) => {
    const formattedStack = error?.stack?.replace(/\\n/g, '\n');
    const formattedMessage = `unhandled error: ${message} ${formattedStack || ''}`;
    window.windowError.push(formattedMessage);
    // eslint-disable-next-line no-console
    console.error(formattedMessage, error || message);
  };
  window.onunhandledrejection = (promiseRejectionEvent) => {
    const { reason } = promiseRejectionEvent;
    const formattedMessage = `unhandled promise rejection: ${reason}`;
    window.windowError.push(formattedMessage);
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
            <ToastProvider>
              <PollConsoleUpdates />
              <AdmissionWebhookWarningNotifications />
              <AppRouter />
            </ToastProvider>
          </AppInitSDK>
        </ThemeProvider>
      </Provider>
    </React.Suspense>,
    document.getElementById('app'),
  );
});
