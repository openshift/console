import type { FC, Provider as ProviderComponent, ReactNode } from 'react';
import { createContext, Suspense, useContext, useEffect, useMemo } from 'react';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import {
  Button,
  Content,
  ContentVariants,
  Masthead,
  MastheadContent,
  MastheadMain,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { createPath, useLocation } from 'react-router';
import type { Perspective, ReduxReducer, ContextProvider } from '@console/dynamic-plugin-sdk';
import {
  PerspectiveContext,
  useResolvedExtensions,
  isContextProvider,
  isReduxReducer,
} from '@console/dynamic-plugin-sdk';
import { applyReduxExtensions } from '@console/internal/redux';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { ForcedPerspectiveContext } from '@console/shared/src/hooks/forcedPerspectiveContext';
import { useForcedPerspective } from '@console/shared/src/hooks/useForcedPerspective';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';
import { useLanguage } from '../user-preferences/language/useLanguage';
import { usePreferredLanguage } from '../user-preferences/language/usePreferredLanguage';
import { NamespaceContext, useValuesForNamespaceContext } from './namespace';
import PerspectiveDetector from './PerspectiveDetector';
import { useValuesForPerspectiveContext } from './useValuesForPerspectiveContext';

const getPerspectiveURLParam = (perspectives: Perspective[]) => {
  const perspectiveIDs = perspectives.map(
    (nextPerspective: Perspective) => nextPerspective.properties.id,
  );

  const urlParams = new URLSearchParams(window.location.search);
  const perspectiveParam = urlParams.get('perspective');
  return perspectiveParam && perspectiveIDs.includes(perspectiveParam) ? perspectiveParam : '';
};

const ContextProviderExtensionsContext = createContext<
  LoadedAndResolvedExtension<ContextProvider>[]
>([]);

const EnhancedProvider: FC<{
  provider: ProviderComponent<any>;
  useValueHook: () => any;
  children: ReactNode;
}> = ({ provider: Component, useValueHook, children }) => {
  const value = useValueHook();
  return <Component value={value}>{children}</Component>;
};

const PF_BREAKPOINT_XL = 1200;

const SlowLoadingMessage: FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation('console-app');
  return (
    <Content className="co-page-skeleton__slow-msg pf-v6-u-text-align-center pf-v6-u-mt-lg">
      <Content component={ContentVariants.p}>{message}</Content>
      <Button
        variant="link"
        isInline
        className="pf-v6-u-mt-sm"
        onClick={() => window.location.reload()}
      >
        {t('Refresh')}
      </Button>
    </Content>
  );
};

/**
 * Empty PatternFly Page shell shown while DetectContext is initializing. Intended to
 * only be rendered once at the start of page load
 */
const PageSkeleton: FC<{ blame: string }> = ({ blame }) => {
  const { t } = useTranslation('console-app');

  return (
    <>
      <div className="co-page-skeleton__auth-pending">
        <LoadingBox blame={blame}>
          <SlowLoadingMessage
            message={t(
              'Unable to connect to the server. This could be due to network or server issues.',
            )}
          />
        </LoadingBox>
      </div>
      <Page
        className="co-page-skeleton__authenticated"
        isContentFilled
        masthead={
          <Masthead>
            <MastheadMain />
            <MastheadContent>
              <div className="co-page-skeleton__masthead-spacer" />
            </MastheadContent>
          </Masthead>
        }
        sidebar={
          <PageSidebar isSidebarOpen={window.innerWidth >= PF_BREAKPOINT_XL}>
            <PageSidebarBody />
          </PageSidebar>
        }
      >
        <PageSection isFilled hasBodyWrapper={false}>
          <LoadingBox blame={blame}>
            <SlowLoadingMessage message={t('The console is taking longer than usual to load.')} />
          </LoadingBox>
        </PageSection>
      </Page>
    </>
  );
};

/** Wraps children in plugin-provided context providers resolved by DetectContext. */
export const ContextProviderExtensionWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const contextProviderExtensions = useContext(ContextProviderExtensionsContext);
  return (
    <Suspense fallback={<PageSkeleton blame="ContextProviderExtensions" />}>
      {contextProviderExtensions.reduce(
        (acc, e) => (
          <EnhancedProvider key={e.uid} {...e.properties}>
            {acc}
          </EnhancedProvider>
        ),
        children,
      )}
    </Suspense>
  );
};

/**
 * Bootstraps the console by running all detection and resolution hooks at the
 * same component level so their async work executes in parallel:
 *
 * - Detect the active perspective (user prefs, URL param, or auto-detection)
 * - Detect the active namespace (user prefs, URL, or K8s API fallback)
 * - Detect the preferred language (user prefs, then apply via i18n)
 * - Resolve all ReduxReducer and ContextProvider plugin extensions
 *
 * Once ready, provides the resolved values via PerspectiveContext,
 * NamespaceContext, and ContextProviderExtensionsContext.
 */
export const DetectContext: FC<{ children: ReactNode }> = ({ children }) => {
  const forcedPerspective = useForcedPerspective();
  const [
    activePerspective,
    setActivePerspective,
    perspectiveLoaded,
  ] = useValuesForPerspectiveContext(forcedPerspective);
  const { namespace, setNamespace, loaded: namespaceLoaded } = useValuesForNamespaceContext();

  const [preferredLanguage, , preferredLanguageLoaded] = usePreferredLanguage();
  useLanguage(preferredLanguage, preferredLanguageLoaded);

  const [reduxReducerExtensions, reducersResolved] = useResolvedExtensions<ReduxReducer>(
    isReduxReducer,
  );
  const [contextProviderExtensions, providersResolved] = useResolvedExtensions<ContextProvider>(
    isContextProvider,
  );

  const perspectiveExtensions = usePerspectives();
  const perspectiveParam = getPerspectiveURLParam(perspectiveExtensions);
  const location = useLocation();

  useEffect(() => {
    if (forcedPerspective.perspectiveId) {
      if (forcedPerspective.perspectiveId !== activePerspective) {
        setActivePerspective(forcedPerspective.perspectiveId, createPath(location));
      }
      return;
    }
    if (perspectiveParam && perspectiveParam !== activePerspective) {
      setActivePerspective(perspectiveParam, createPath(location));
    }
  }, [
    forcedPerspective.perspectiveId,
    perspectiveParam,
    activePerspective,
    setActivePerspective,
    location,
  ]);

  useEffect(() => {
    if (reducersResolved) {
      applyReduxExtensions(reduxReducerExtensions);
    }
  }, [reducersResolved, reduxReducerExtensions]);

  const needsPerspectiveDetection =
    perspectiveLoaded && !activePerspective && !forcedPerspective.perspectiveId;
  const ready =
    perspectiveLoaded &&
    !!activePerspective &&
    namespaceLoaded &&
    reducersResolved &&
    providersResolved &&
    preferredLanguageLoaded;

  const perspectiveContextValue = useMemo(() => ({ activePerspective, setActivePerspective }), [
    activePerspective,
    setActivePerspective,
  ]);
  const namespaceContextValue = useMemo(() => ({ namespace, setNamespace }), [
    namespace,
    setNamespace,
  ]);

  if (!ready) {
    const pending: string[] = [];
    if (!perspectiveLoaded) pending.push('Perspective');
    if (needsPerspectiveDetection) pending.push('PerspectiveDetection');
    if (!namespaceLoaded) pending.push('Namespace');
    if (!reducersResolved) pending.push('Reducers');
    if (!providersResolved) pending.push('Providers');
    if (!preferredLanguageLoaded) pending.push('Language');

    return (
      <>
        {needsPerspectiveDetection && (
          <PerspectiveDetector setActivePerspective={setActivePerspective} />
        )}
        <PageSkeleton blame={pending.join(', ')} />
      </>
    );
  }

  return (
    <ForcedPerspectiveContext.Provider value={forcedPerspective}>
      <PerspectiveContext.Provider value={perspectiveContextValue}>
        <NamespaceContext.Provider value={namespaceContextValue}>
          <ContextProviderExtensionsContext.Provider value={contextProviderExtensions}>
            {children}
          </ContextProviderExtensionsContext.Provider>
        </NamespaceContext.Provider>
      </PerspectiveContext.Provider>
    </ForcedPerspectiveContext.Provider>
  );
};
