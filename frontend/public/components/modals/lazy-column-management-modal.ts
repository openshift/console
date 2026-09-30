import { lazy } from 'react';

export const LazyColumnManagementModalOverlay = lazy(() =>
  import('./column-management-modal' /* webpackChunkName: "column-management-modal" */).then(
    (m) => ({
      default: m.ColumnManagementModalOverlay,
    }),
  ),
);
