import type { LaunchOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';

// Module-level reference for non-React contexts (topology connectors)
// This gets synced via SyncPubSubModalLauncher component
let launchPubSubModalRef: LaunchOverlay | null = null;

export const setPubSubModalLauncher = (launcher: LaunchOverlay | null) => {
  launchPubSubModalRef = launcher;
};

export const getLaunchPubSubModalRef = (): LaunchOverlay | null => launchPubSubModalRef;
