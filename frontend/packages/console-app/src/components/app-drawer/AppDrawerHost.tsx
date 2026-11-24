import type { FC, ReactNode } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { AppDrawer } from '@console/dynamic-plugin-sdk';
import { isAppDrawer, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { ErrorBoundaryInline } from '@console/shared/src/components/error/fallbacks/ErrorBoundaryInline';
import { AppDrawerContext } from '@console/shared/src/hooks/useAppDrawer';

interface AppDrawerHostProps {
  children: ReactNode;
}

interface AppDrawerErrorFallbackProps {
  children: ReactNode;
  onClose: () => void;
}

// Keeps the drawer closable when the plugin panel, which normally renders the close button, fails
const AppDrawerErrorFallback: FC<AppDrawerErrorFallbackProps> = ({ children, onClose }) => {
  const { t } = useTranslation('console-app');
  return (
    <DrawerHead>
      {children}
      <DrawerActions>
        <DrawerCloseButton aria-label={t('Close')} onClick={onClose} />
      </DrawerActions>
    </DrawerHead>
  );
};

/**
 * Renders app-level side panels contributed via the `console.app/drawer` extension as a
 * PatternFly Drawer wrapping the Console page. Owns the open state shared with plugins through
 * `useAppDrawer`. At most one app drawer is open at a time.
 */
export const AppDrawerHost: FC<AppDrawerHostProps> = ({ children }) => {
  const { t } = useTranslation('console-app');
  const [drawers] = useResolvedExtensions<AppDrawer>(isAppDrawer);
  const [openDrawerIds, setOpenDrawerIds] = useState<string[]>([]);

  const setDrawerOpen = useCallback((id: string, open: boolean) => {
    setOpenDrawerIds((prev) => {
      if (open) {
        return prev.length === 1 && prev[0] === id ? prev : [id];
      }
      return prev.includes(id) ? prev.filter((openId) => openId !== id) : prev;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ openDrawerIds, setDrawerOpen }),
    [openDrawerIds, setDrawerOpen],
  );

  const activeDrawer = drawers.find((drawer) => openDrawerIds.includes(drawer.properties.id));
  const activeDrawerId = activeDrawer?.properties.id;

  useEffect(() => {
    const timeout = setTimeout(() => window.dispatchEvent(new Event('sidebar_toggle')), 250);
    return () => clearTimeout(timeout);
  }, [activeDrawerId]);

  const closeActiveDrawer = useCallback(
    () => setDrawerOpen(activeDrawerId, false),
    [activeDrawerId, setDrawerOpen],
  );

  const errorFallbackWrapper = useCallback(
    ({ children: fallback }: { children: ReactNode }) => (
      <AppDrawerErrorFallback onClose={closeActiveDrawer}>{fallback}</AppDrawerErrorFallback>
    ),
    [closeActiveDrawer],
  );

  const panelContent = activeDrawer ? (
    <DrawerPanelContent
      defaultSize={activeDrawer.properties.defaultSize}
      isResizable={activeDrawer.properties.isResizable ?? true}
      key={activeDrawerId}
      minSize={activeDrawer.properties.minSize}
      resizeAriaLabel={t('Resize')}
    >
      <ErrorBoundaryInline wrapper={errorFallbackWrapper}>
        <Suspense fallback={null}>
          <activeDrawer.properties.panel onClose={closeActiveDrawer} />
        </Suspense>
      </ErrorBoundaryInline>
    </DrawerPanelContent>
  ) : null;

  return (
    <AppDrawerContext.Provider value={contextValue}>
      <Drawer isInline isExpanded={!!activeDrawer} id="co-app-drawer">
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody>{children}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </AppDrawerContext.Provider>
  );
};
