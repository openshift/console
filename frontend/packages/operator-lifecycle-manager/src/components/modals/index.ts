import { lazy } from 'react';

// Lazy-loaded OverlayComponent for InstallPlan Approval Modal
export const LazyInstallPlanApprovalModalOverlay = lazy(() =>
  import('./installplan-approval-modal' /* webpackChunkName: "installplan-approval-modal" */).then(
    (m) => ({
      default: m.InstallPlanApprovalModalOverlay,
    }),
  ),
);

// Lazy-loaded OverlayComponent for Subscription Channel Modal
export const LazySubscriptionChannelModalOverlay = lazy(() =>
  import('./subscription-channel-modal' /* webpackChunkName: "subscription-channel-modal" */).then(
    (m) => ({
      default: m.SubscriptionChannelModalOverlay,
    }),
  ),
);

// Lazy-loaded OverlayComponent for Uninstall Operator Modal
export const LazyUninstallOperatorModalOverlay = lazy(() =>
  import('./uninstall-operator-modal' /* webpackChunkName: "uninstall-operator-modal" */).then(
    (m) => ({
      default: m.UninstallOperatorModalOverlay,
    }),
  ),
);

// Lazy-loaded OverlayComponent for Disable Default Source Modal
export const LazyDisableDefaultSourceModalOverlay = lazy(() =>
  import(
    './disable-default-source-modal' /* webpackChunkName: "disable-default-source-modal" */
  ).then((m) => ({
    default: m.DisableDefaultSourceModalOverlay,
  })),
);

// Lazy-loaded OverlayComponent for Edit Default Sources Modal
export const LazyEditDefaultSourcesModalOverlay = lazy(() =>
  import('./edit-default-sources-modal' /* webpackChunkName: "edit-default-sources-modal" */).then(
    (m) => ({
      default: m.EditDefaultSourcesModalOverlay,
    }),
  ),
);

// Lazy-loaded OverlayComponent for InstallPlan Preview Modal
export const LazyInstallPlanPreviewModalOverlay = lazy(() =>
  import('./installplan-preview-modal' /* webpackChunkName: "installplan-preview-modal" */).then(
    (m) => ({
      default: m.InstallPlanPreviewModalOverlay,
    }),
  ),
);

// Lazy-loaded OverlayComponent for Update Strategy Modal
export const LazyUpdateStrategyModalOverlay = lazy(() =>
  import('./update-strategy-modal' /* webpackChunkName: "update-strategy-modal" */).then((m) => ({
    default: m.UpdateStrategyModalOverlay,
  })),
);
