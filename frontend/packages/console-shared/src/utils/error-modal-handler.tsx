import { useCallback, useEffect } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ErrorModalProps } from '@console/internal/components/modals/error-modal';
import { ErrorModal } from '@console/internal/components/modals/error-modal';
import { useSyncWarningModalLauncher } from './warning-modal-handler';

// Module-level reference for non-React contexts
// This is populated by useSyncErrorModalLauncher and should not be set directly
let moduleErrorModalLauncher: ((props: ErrorModalProps) => void) | null = null;

/**
 * Hook to launch error modals from React components.
 * Must be used within an OverlayProvider.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const launchErrorModal = useErrorModal();
 *
 *   const handleError = (error: Error) => {
 *     launchErrorModal({
 *       title: 'Operation Failed',
 *       error: error.message,
 *     });
 *   };
 *
 *   // ...
 * };
 * ```
 */
export const useErrorModal = (
  props?: Partial<ErrorModalProps>,
): ((overrides?: ErrorModalProps) => void) => {
  const launcher = useOverlay();
  return useCallback(
    (overrides?: ErrorModalProps) => {
      const mergedProps: ErrorModalProps = {
        error: '',
        ...(props || {}),
        ...(overrides || {}),
      };
      launcher<ErrorModalProps>(ErrorModal, mergedProps);
    },
    [launcher, props],
  );
};

/**
 * Hook that syncs the error modal launcher to module-level for non-React contexts.
 * Use SyncModalLaunchers component instead of calling this directly.
 */
export const useSyncErrorModalLauncher = () => {
  const errorModalLauncher = useErrorModal();

  useEffect(() => {
    moduleErrorModalLauncher = errorModalLauncher;

    return () => {
      // Only clear if we're still the active launcher
      if (moduleErrorModalLauncher === errorModalLauncher) {
        moduleErrorModalLauncher = null;
      }
    };
  }, [errorModalLauncher]);
};

/**
 * Component that syncs both error and warning modal launchers to module-level for non-React contexts.
 * This should be mounted once in the app root, after OverlayProvider.
 *
 * @example
 * ```tsx
 * const App = () => (
 *   <OverlayProvider>
 *     <SyncModalLaunchers />
 *     <YourApp />
 *   </OverlayProvider>
 * );
 * ```
 */
export const SyncModalLaunchers = () => {
  useSyncErrorModalLauncher();
  useSyncWarningModalLauncher();
  return null;
};

/**
 * Launch an error modal from non-React contexts (callbacks, promises, utilities).
 * The SyncModalLaunchers component must be mounted in the app root.
 *
 * @deprecated Use React component modals within component code instead.
 * For new code, write modals directly within React components using useOverlay or other modal patterns.
 * This function should only be used for legacy non-React contexts like promise callbacks.
 *
 * @example
 * ```tsx
 * // In a promise callback or utility function
 * createConnection(source, target).catch((error) => {
 *   launchErrorModal({
 *     title: 'Connection Failed',
 *     error: error.message,
 *   });
 * });
 * ```
 */
export const launchErrorModal = (props: ErrorModalProps): void => {
  if (moduleErrorModalLauncher) {
    moduleErrorModalLauncher(props);
  } else {
    throw new Error(
      'Error modal launcher not initialized. Ensure SyncModalLaunchers is mounted after OverlayProvider.',
    );
  }
};
