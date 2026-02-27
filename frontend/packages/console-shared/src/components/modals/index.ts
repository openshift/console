import { lazy } from 'react';

export const consolePluginModal = (props) =>
  import('./ConsolePluginModal' /* webpackChunkName: "shared-modals" */).then((m) =>
    m.default(props),
  );

export const LazyDeleteResourceModalOverlay = lazy(() =>
  import('./DeleteResourceModal' /* webpackChunkName: "delete-resource-modal" */).then((m) => ({
    default: m.DeleteResourceModalOverlay,
  })),
);
