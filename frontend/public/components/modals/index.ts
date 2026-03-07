// This module utilizes dynamic `import()` to enable lazy-loading for each modal instead of including them in the main bundle.

import { lazy } from 'react';

// Helper to detect if a modal is open. This is used to disable autofocus in elements under a modal.
// TODO: Improve focus and keybinding handling, see https://issues.redhat.com/browse/ODC-3554
export const isModalOpen = () => document.body.classList.contains('ReactModal__Body--open');

export const configureJobParallelismModal = (props) =>
  import('./configure-count-modal' /* webpackChunkName: "configure-count-modal" */).then((m) =>
    m.configureJobParallelismModal(props),
  );

// Lazy-loaded OverlayComponent for Configure Namespace Pull Secret Modal
export const LazyConfigureNamespacePullSecretModalOverlay = lazy(() =>
  import(
    './configure-ns-pull-secret-modal' /* webpackChunkName: "configure-ns-pull-secret-modal" */
  ).then((m) => ({
    default: m.ConfigureNamespacePullSecretModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Labels Modal
export const LazyLabelsModalOverlay = lazy(() =>
  import('./labels-modal' /* webpackChunkName: "labels-modal" */).then((m) => ({
    default: m.LabelsModalOverlay,
  })),
);

export const rollbackModal = (props) =>
  import('./rollback-modal' /* webpackChunkName: "rollback-modal" */).then((m) =>
    m.rollbackModal(props),
  );

// Lazy-loaded OverlayComponent for Configure Update Strategy Modal
export const LazyConfigureUpdateStrategyModalOverlay = lazy(() =>
  import(
    './configure-update-strategy-modal' /* webpackChunkName: "configure-update-strategy-modal" */
  ).then((m) => ({
    default: m.ConfigureUpdateStrategyModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Annotations Modal
export const LazyAnnotationsModalOverlay = lazy(() =>
  import('./tags' /* webpackChunkName: "tags" */).then((m) => ({
    default: m.AnnotationsModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Delete Modal
export const LazyDeleteModalOverlay = lazy(() =>
  import('./delete-modal' /* webpackChunkName: "delete-modal" */).then((m) => ({
    default: m.DeleteModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Delete PVC Modal
export const LazyDeletePVCModalOverlay = lazy(() =>
  import('./delete-pvc-modal' /* webpackChunkName: "delete-pvc-modal" */).then((m) => ({
    default: m.DeletePVCModalOverlay,
  })),
);

export const clusterChannelModal = (props) =>
  import('./cluster-channel-modal' /* webpackChunkName: "cluster-channel-modal" */).then((m) =>
    m.clusterChannelModal(props),
  );

export const clusterMoreUpdatesModal = (props) =>
  import(
    './cluster-more-updates-modal' /* webpackChunkName: "cluster-more-updates-modal" */
  ).then((m) => m.clusterMoreUpdatesModal(props));

export const clusterUpdateModal = (props) =>
  import('./cluster-update-modal' /* webpackChunkName: "cluster-update-modal" */).then((m) =>
    m.clusterUpdateModal(props),
  );

export const taintsModal = (props) =>
  import('./taints-modal' /* webpackChunkName: "taints-modal" */).then((m) => m.taintsModal(props));

export const tolerationsModal = (props) =>
  import('./tolerations-modal' /* webpackChunkName: "tolerations-modal" */).then((m) =>
    m.tolerationsModal(props),
  );

// Lazy-loaded OverlayComponent for Expand PVC Modal
export const LazyExpandPVCModalOverlay = lazy(() =>
  import('./expand-pvc-modal' /* webpackChunkName: "expand-pvc-modal" */).then((m) => ({
    default: m.ExpandPVCModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Clone PVC Modal
export const LazyClonePVCModalOverlay = lazy(() =>
  import(
    '@console/app/src/components/modals/clone/clone-pvc-modal' /* webpackChunkName: "clone-pvc-modal" */
  ).then((m) => ({ default: m.ClonePVCModalOverlay })),
);

// Lazy-loaded OverlayComponent for Configure Cluster Upstream Modal
export const LazyConfigureClusterUpstreamModalOverlay = lazy(() =>
  import(
    './configure-cluster-upstream-modal' /* webpackChunkName: "configure-cluster-upstream-modal" */
  ).then((m) => ({
    default: m.ConfigureClusterUpstreamModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Alert Routing Modal
export const LazyAlertRoutingModalOverlay = lazy(() =>
  import('./alert-routing-modal' /* webpackChunkName: "alert-routing-modal" */).then((m) => ({
    default: m.AlertRoutingModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Column Management Modal
export const LazyColumnManagementModalOverlay = lazy(() =>
  import('./column-management-modal' /* webpackChunkName: "column-management-modal" */).then(
    (m) => ({
      default: m.ColumnManagementModalOverlay,
    }),
  ),
);

// Lazy-loaded OverlayComponent for Restore PVC Modal
export const LazyRestorePVCModalOverlay = lazy(() =>
  import(
    '@console/app/src/components/modals/restore-pvc/restore-pvc-modal' /* webpackChunkName: "restore-pvc-modal" */
  ).then((m) => ({ default: m.RestorePVCModalOverlay })),
);

// Lazy-loaded OverlayComponent for Managed Resource Save Modal
export const LazyManagedResourceSaveModalOverlay = lazy(() =>
  import(
    './managed-resource-save-modal' /* webpackChunkName: "managed-resource-save-modal" */
  ).then((m) => ({
    default: m.ManagedResourceSaveModalOverlay,
  })),
);
