import { lazy } from 'react';

// Lazy-loaded OverlayComponent for ConsolePluginModal
export const LazyConsolePluginModalOverlay = lazy(() =>
  import('./ConsolePluginModal' /* webpackChunkName: "shared-modals" */).then((m) => ({
    default: m.ConsolePluginModalOverlay,
  })),
);
