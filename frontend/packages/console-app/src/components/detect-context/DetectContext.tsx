import type { FC, Provider as ProviderComponent, ReactNode } from 'react';
import { createContext, Suspense, useContext, useEffect } from 'react';
import type { LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import {
  Masthead,
  MastheadContent,
  MastheadMain,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core';
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

/** Empty PatternFly Page shell shown while DetectContext is initializing. */
export const PageSkeleton: FC<{ blame: string }> = ({ blame }) => (
  <Page
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
      <LoadingBox blame={blame} />
    </PageSection>
  </Page>
);

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
  const [
    activePerspective,
    setActivePerspective,
    perspectiveLoaded,
  ] = useValuesForPerspectiveContext();
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
    if (perspectiveParam && perspectiveParam !== activePerspective) {
      setActivePerspective(perspectiveParam, createPath(location));
    }
  }, [perspectiveParam, activePerspective, setActivePerspective, location]);

  useEffect(() => {
    if (reducersResolved) {
      applyReduxExtensions(reduxReducerExtensions);
    }
  }, [reducersResolved, reduxReducerExtensions]);

  const needsPerspectiveDetection = perspectiveLoaded && !activePerspective;
  const ready =
    perspectiveLoaded &&
    !!activePerspective &&
    namespaceLoaded &&
    reducersResolved &&
    providersResolved &&
    preferredLanguageLoaded;

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
    <PerspectiveContext.Provider value={{ activePerspective, setActivePerspective }}>
      <NamespaceContext.Provider value={{ namespace, setNamespace }}>
        <ContextProviderExtensionsContext.Provider value={contextProviderExtensions}>
          {children}
        </ContextProviderExtensionsContext.Provider>
      </NamespaceContext.Provider>
    </PerspectiveContext.Provider>
  );
};
