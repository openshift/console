/* eslint-disable @typescript-eslint/no-use-before-define */
import * as _ from 'lodash';
import { useState, useRef, useCallback, useEffect, useLayoutEffect, memo, Suspense } from 'react';
import type { FC, Provider as ProviderComponent, ReactNode } from 'react';
import { render } from 'react-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { linkify } from 'react-linkify';
import * as Modal from 'react-modal';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { Router } from 'react-router-dom';
import { useParams, useLocation, CompatRouter, Routes, Route } from 'react-router-dom-v5-compat';
import store, { applyReduxExtensions, RootState } from '../redux';
import { useTranslation } from 'react-i18next';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import { PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { detectFeatures } from '../actions/features';
import { setFlag } from '../actions/flags';
import AppContents from './app-contents';
import { Masthead } from './masthead/masthead';
import { getBrandingDetails } from './utils/branding';
import { ConsoleNotifier } from './console-notifier';
import { NotificationDrawer } from './notification-drawer';
import { Navigation } from '@console/app/src/components/nav';
import { history } from './utils/router';
import { AsyncComponent } from './utils/async';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import * as UIActions from '../actions/ui';
import { fetchSwagger, getCachedResources } from '../module/k8s';
import { receivedResources, startAPIDiscovery } from '../actions/k8s';
import { pluginStore } from '../plugins';
// cloud shell imports must come later than features
import CloudShellDrawer from '@console/webterminal-plugin/src/components/cloud-shell/CloudShell';
import DetectPerspective from '@console/app/src/components/detect-perspective/DetectPerspective';
import DetectNamespace from '@console/app/src/components/detect-namespace/DetectNamespace';
import DetectLanguage from '@console/app/src/components/detect-language/DetectLanguage';
import { FeatureFlagExtensionLoader } from '@console/app/src/components/flags/FeatureFlagExtensionLoader';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import {
  useResolvedExtensions,
  isContextProvider,
  isReduxReducer,
  isStandaloneRoutePage,
  getUser,
  useActivePerspective,
  ReduxReducer,
  ContextProvider,
} from '@console/dynamic-plugin-sdk';
import { GuidedTour } from '@console/app/src/components/tour';
import { QuickStartDrawer } from '@console/app/src/components/quick-starts/QuickStartDrawer';
import { ModalProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { OverlayProvider } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import ToastProvider from '@console/shared/src/components/toast/ToastProvider';
import { SyncErrorModalLauncher } from '@console/shared/src/utils/error-modal-handler';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useDebounceCallback } from '@console/shared/src/hooks/debounce';
import { LOGIN_ERROR_PATH } from '@console/internal/module/auth';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/flag';
import Lightspeed from '@console/app/src/components/lightspeed/Lightspeed';
import { ThemeProvider } from './ThemeProvider';
import { init as initI18n } from '../i18n';
import { Flex, Page, SkipToContent } from '@patternfly/react-core';
import { AuthenticationErrorPage } from './error';
import '../vendor.scss';
import '../style.scss';
import '@patternfly/quickstarts/dist/quickstarts.min.css';

const PF_BREAKPOINT_MD = 768;
const PF_BREAKPOINT_XL = 1200;
const NOTIFICATION_DRAWER_BREAKPOINT = 1800;
import { PollConsoleUpdates } from './poll-console-updates';
import { withoutSensitiveInformations, getTelemetryTitle } from './utils/telemetry';
import { graphQLReady } from '../graphql/client';
import { AdmissionWebhookWarningNotifications } from '@console/app/src/components/admission-webhook-warnings/AdmissionWebhookWarningNotifications';
import { usePackageManifestCheck } from '@console/shared/src/hooks/usePackageManifestCheck';
import { useCSPViolationDetector } from '@console/app/src/hooks/useCSPViolationDetector';
import { useNotificationPoller } from '@console/app/src/hooks/useNotificationPoller';
import { useImpersonateRefreshFeatures } from './useImpersonateRefreshFeatures';

initI18n();

// Disable linkify 'fuzzy links' across the app.
// Only linkify url strings beginning with a proper protocol scheme.
linkify.set({ fuzzyLink: false });

const EnhancedProvider: FC<{
  provider: ProviderComponent<any>;
  useValueHook: () => any;
  children: ReactNode;
}> = ({ provider: Component, useValueHook, children }) => {
  const value = useValueHook();
  return <Component value={value}>{children}</Component>;
};

const App: FC<{
  contextProviderExtensions: LoadedAndResolvedExtension<ContextProvider>[];
}> = ({ contextProviderExtensions }) => {
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

  const [prevLocation, setPrevLocation] = useState(location);
  const [prevParams, setPrevParams] = useState(params);

  const [isMastheadStacked, setIsMastheadStacked] = useState(isMobile());
  const [isNavOpen, setIsNavOpen] = useState(isDesktop());

  const previousDesktopState = useRef(isDesktop());
  const previousMobileState = useRef(isMobile());

  const onResize = useCallback(() => {
    const desktop = isDesktop();
    const mobile = isMobile();
    if (previousDesktopState.current !== desktop) {
      setIsNavOpen(desktop);
      previousDesktopState.current = desktop;
    }
    if (previousMobileState.current !== mobile) {
      setIsMastheadStacked(mobile);
      previousMobileState.current = mobile;
    }
  }, []);

  useCSPViolationDetector();
  useNotificationPoller();

  // Initialize react-modal app element for accessibility
  useLayoutEffect(() => {
    const appElement = document.getElementById('app-content');
    if (appElement) {
      Modal.setAppElement(appElement);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [onResize]);

  useLayoutEffect(() => {
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

  // Handle feature refresh after impersonation changes
  useImpersonateRefreshFeatures();

  const [, , errorMessage] = usePackageManifestCheck(
    'lightspeed-operator',
    'openshift-marketplace',
  );

  useEffect(() => {
    const lightspeedButtonCapability = window.SERVER_FLAGS.capabilities?.find(
      (capability) => capability.name === 'LightspeedButton',
    );
    const gettingStartedBannerCapability = window.SERVER_FLAGS.capabilities?.find(
      (capability) => capability.name === 'GettingStartedBanner',
    );
    const guidedTourCapability = window.SERVER_FLAGS.capabilities?.find(
      (capability) => capability.name === 'GuidedTour',
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
    dispatch(
      setFlag(
        FLAGS.CONSOLE_CAPABILITY_GUIDEDTOUR_IS_ENABLED,
        guidedTourCapability?.visibility?.state === 'Enabled',
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
    // close nav on mobile nav selects
    if (!isDesktop()) {
      setIsNavOpen(false);
    }
  };

  const isNotificationDrawerExpanded = useSelector(
    ({ UI }: RootState) => !!UI.getIn(['notifications', 'isExpanded']),
  );

  const drawerRef = useRef<HTMLElement | null>(null);

  const focusDrawer = () => {
    if (drawerRef.current === null) {
      return;
    }
    // Focus first tabbable item
    drawerRef.current.querySelector<HTMLAnchorElement | HTMLButtonElement>('a, button')?.focus();
  };

  const content = (
    <>
      <ConsoleNotifier location="BannerTop" />
      <QuickStartDrawer>
        <CloudShellDrawer>
          <Flex
            id="app-content"
            direction={{ default: 'column' }}
            style={{ flex: '1 0 auto', height: '100%' }}
          >
            <Page
              isContentFilled
              id="content"
              // Need to pass mainTabIndex=null to enable keyboard scrolling as default tabIndex is set to -1 by patternfly
              mainTabIndex={null}
              masthead={
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
                <SkipToContent href={`${location.pathname}${location.search}#content-scrollable`}>
                  {t('public~Skip to content')}
                </SkipToContent>
              }
              notificationDrawer={
                <NotificationDrawer
                  onDrawerChange={onNotificationDrawerToggle}
                  isDrawerExpanded={isNotificationDrawerExpanded}
                  drawerRef={drawerRef}
                />
              }
              onNotificationDrawerExpand={() => focusDrawer()}
              isNotificationDrawerExpanded={isNotificationDrawerExpanded}
              style={{ flex: '1', height: '0' }}
            >
              <AppContents />
            </Page>
            <GuidedTour />
          </Flex>
          {consoleCapabilityLightspeedButtonIsEnabled && lightspeedIsAvailableToInstall && (
            <Lightspeed />
          )}
        </CloudShellDrawer>
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
          <OverlayProvider>
            <SyncErrorModalLauncher />
            <Suspense fallback={<LoadingBox blame="contextProviderExtensions suspense" />}>
              {contextProviderExtensions.reduce(
                (children, e) => (
                  <EnhancedProvider key={e.uid} {...e.properties}>
                    {children}
                  </EnhancedProvider>
                ),
                content,
              )}
            </Suspense>
          </OverlayProvider>
        </ModalProvider>
      </DetectNamespace>
      <DetectLanguage />
    </DetectPerspective>
  );
};

const AppWithExtensions: FC = () => {
  const [reduxReducerExtensions, reducersResolved] = useResolvedExtensions<ReduxReducer>(
    isReduxReducer,
  );
  const [contextProviderExtensions, providersResolved] = useResolvedExtensions<ContextProvider>(
    isContextProvider,
  );

  if (reducersResolved && providersResolved) {
    applyReduxExtensions(reduxReducerExtensions);
    return <App contextProviderExtensions={contextProviderExtensions} />;
  }

  return <LoadingBox blame="AppWithExtensions" />;
};

render(<LoadingBox blame="Init" />, document.getElementById('app'));

const AppRouter: FC = () => {
  const standaloneRouteExtensions = useExtensions(isStandaloneRoutePage);
  // Treat the authentication error page as a standalone route. There is no need to render the rest
  // of the app if we know authentication has failed.
  return (
    <Router history={history}>
      <CompatRouter>
        <Routes>
          <Route path={LOGIN_ERROR_PATH} element={<AuthenticationErrorPage />} />
          {standaloneRouteExtensions.map((e) => (
            <Route
              key={e.uid}
              element={<AsyncComponent loader={e.properties.component} />}
              path={`${e.properties.path}${e.properties.exact ? '' : '/*'}`}
            />
          ))}
          <Route path="/*" element={<AppWithExtensions />} />
        </Routes>
      </CompatRouter>
    </Router>
  );
};

const CaptureTelemetry = memo(function CaptureTelemetry() {
  const [perspective] = useActivePerspective();
  const fireTelemetryEvent = useTelemetry();
  const [debounceTime, setDebounceTime] = useState(5000);
  const [titleOnLoad, setTitleOnLoad] = useState('');
  // notify of identity change
  const user = useSelector(getUser);
  const telemetryTitle = getTelemetryTitle();

  useEffect(() => {
    setTimeout(() => {
      setTitleOnLoad(telemetryTitle);
      setDebounceTime(500);
    }, 5000);
  }, [telemetryTitle]);

  useEffect(() => {
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
  useEffect(() => {
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
    return () => {
      unlisten();
    };
  }, [perspective, fireUrlChangeEvent, titleOnLoad]);

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
  const { productName } = getBrandingDetails();
  store.dispatch<any>(detectFeatures());

  initApiDiscovery(store);

  // Global timer to ensure all <Timestamp> components update in sync
  setInterval(() => store.dispatch(UIActions.updateTimestamps(Date.now())), 10000);

  // Used by GUI tests to check for unhandled exceptions
  window.windowError = null;
  window.onerror = (message, source, lineno, colno, error) => {
    // ResizeObserver loop errors are non-actionable and can be ignored
    if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
      return undefined;
    }

    const formattedStack = error?.stack?.replace(/\\n/g, '\n');
    const formattedMessage = `unhandled error: ${message} ${formattedStack || ''}`;
    window.windowError = `${window.windowError ?? ''};${formattedMessage}`;
    // eslint-disable-next-line no-console
    console.error(formattedMessage, error || message);
  };
  window.onunhandledrejection = (promiseRejectionEvent) => {
    const { reason } = promiseRejectionEvent;
    const formattedMessage = `unhandled promise rejection: ${reason}`;
    window.windowError = `${window.windowError ?? ''};${formattedMessage}`;
    // eslint-disable-next-line no-console
    console.error(formattedMessage, reason);
  };

  if ('serviceWorker' in navigator) {
    if (window.SERVER_FLAGS.loadTestFactor > 1) {
      // eslint-disable-next-line import/no-unresolved
      // @ts-expect-error file-loader is not a module but it does resolve
      import('file-loader?name=load-test.sw.js!../load-test.sw.js')
        .then(() => navigator.serviceWorker.register('/load-test.sw.js'))
        .then(
          () =>
            new Promise<void>((r) =>
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
    <Suspense fallback={<LoadingBox blame="Root suspense" />}>
      <Provider store={store}>
        <PluginStoreProvider store={pluginStore}>
          <ThemeProvider>
            <HelmetProvider>
              <Helmet titleTemplate={`%s · ${productName}`} defaultTitle={productName} />
              <ToastProvider>
                <PollConsoleUpdates />
                <AdmissionWebhookWarningNotifications />
                <AppRouter />
              </ToastProvider>
            </HelmetProvider>
          </ThemeProvider>
        </PluginStoreProvider>
      </Provider>
    </Suspense>,
    document.getElementById('app'),
  );
});
