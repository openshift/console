import { lazy } from 'react';

// Lazy-loaded OverlayComponent for ConsolePluginModal
export const LazyConsolePluginModalOverlay = lazy(() =>
  import('./ConsolePluginModal' /* webpackChunkName: "shared-modals" */).then((m) => ({
    default: m.ConsolePluginModalOverlay,
  })),
);

export const LazyDeleteResourceModalOverlay = lazy(() =>
  import('./DeleteResourceModal' /* webpackChunkName: "delete-resource-modal" */).then((m) => ({
    default: m.DeleteResourceModalOverlay,
  })),
);
