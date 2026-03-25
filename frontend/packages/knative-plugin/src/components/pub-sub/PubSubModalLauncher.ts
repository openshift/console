import { lazy } from 'react';
import type { LaunchOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';

// Lazy-loaded OverlayComponent for PubSub Modal
export const LazyPubSubModalOverlay = lazy(() =>
  import('./PubSubController' /* webpackChunkName: "pub-sub-connectors" */).then((m) => ({
    default: m.PubSubModalOverlay,
  })),
);

// Module-level reference for non-React contexts (topology connectors)
// This gets synced via SyncPubSubModalLauncher component
let launchPubSubModalRef: LaunchOverlay | null = null;

export const setPubSubModalLauncher = (launcher: LaunchOverlay | null) => {
  launchPubSubModalRef = launcher;
};

// Imperative API for non-React contexts (topology connectors)
// Uses the launcher from OverlayProvider context to ensure proper accessibility
export const addPubSubConnectionModal = (props) => {
  return import('./PubSubController' /* webpackChunkName: "pub-sub-connectors" */).then((m) => {
    if (!launchPubSubModalRef) {
      // eslint-disable-next-line no-console
      console.error(
        'PubSub modal launcher not initialized. Make sure SyncPubSubModalLauncher is rendered in the topology component tree.',
      );
      return Promise.reject(new Error('Modal launcher not available'));
    }

    return new Promise<void>((resolve, reject) => {
      let settled = false;

      const wrappedResolve = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      const wrappedReject = (error: Error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      launchPubSubModalRef(m.PubSubModalOverlay, {
        ...props,
        close: wrappedResolve,
        cancel: () => wrappedReject(new Error('User cancelled')),
        // Handle overlay dismissal (ESC key, click outside, etc.)
        onOverlayClose: () => wrappedReject(new Error('User cancelled via overlay')),
      });
    });
  });
};
