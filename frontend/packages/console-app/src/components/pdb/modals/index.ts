import { lazy } from 'react';

// Lazy-loaded OverlayComponent for Delete PDB Modal
export const LazyDeletePDBModalOverlay = lazy(() =>
  import('./DeletePDBModal' /* webpackChunkName: "delete-pdb-modal" */).then((m) => ({
    default: m.DeletePDBModalOverlay,
  })),
);
