import { lazy } from 'react';

export const LazyConsoleDataViewColumnManagementModalOverlay = lazy(() =>
  import(
    './ConsoleDataViewColumnManagementModal' /* webpackChunkName: "console-data-view-column-management-modal" */
  ).then((m) => ({
    default: m.ConsoleDataViewColumnManagementModalOverlay,
  })),
);
