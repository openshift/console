import { useEffect } from 'react';
import type { ControlledWarningModalProps } from '../hooks/useWarningModal';
import { useWarningModal } from '../hooks/useWarningModal';

// Module-level reference for non-React contexts
// This is populated by useSyncWarningModalLauncher and should not be set directly
let moduleWarningModalLauncher: ((props: ControlledWarningModalProps) => void) | null = null;

/**
 * Hook that syncs the warning modal launcher to module-level for non-React contexts.
 * This should be called once in the app root, after OverlayProvider.
 * Use SyncModalLaunchers component from error-modal-handler instead of calling this directly.
 */
export const useSyncWarningModalLauncher = () => {
  const warningModalLauncher = useWarningModal();

  useEffect(() => {
    moduleWarningModalLauncher = warningModalLauncher;

    return () => {
      // Only clear if we're still the active launcher
      if (moduleWarningModalLauncher === warningModalLauncher) {
        moduleWarningModalLauncher = null;
      }
    };
  }, [warningModalLauncher]);
};

/**
 * Launch a warning modal from non-React contexts (callbacks, promises, utilities).
 * The SyncModalLaunchers component must be mounted in the app root.
 *
 * @deprecated Use React component modals within component code instead.
 * For new code, write modals directly within React components using useWarningModal.
 * This function should only be used for legacy non-React contexts like promise callbacks.
 *
 * @param props - Warning modal properties (title, children, confirmButtonLabel, etc.)
 * @param onConfirm - Optional callback invoked when user confirms the action
 * @param onCancel - Optional callback invoked when user cancels or closes the modal
 *
 * @example
 * ```tsx
 * // In a utility function or non-React context
 * launchWarningModal(
 *   {
 *     title: 'Delete Resource',
 *     children: 'Are you sure you want to delete this resource?',
 *     confirmButtonLabel: 'Delete',
 *   },
 *   () => {
 *     // User confirmed - proceed with action
 *     deleteResource();
 *   },
 *   () => {
 *     // User canceled
 *     console.log('Action cancelled by user');
 *   }
 * );
 * ```
 */
export const launchWarningModal = (
  props: Omit<ControlledWarningModalProps, 'onConfirm' | 'onClose'>,
  onConfirm?: () => void,
  onCancel?: () => void,
): void => {
  if (moduleWarningModalLauncher) {
    moduleWarningModalLauncher({
      ...props,
      onConfirm: () => {
        onConfirm?.();
      },
      onClose: () => {
        onCancel?.();
      },
    });
  } else {
    throw new Error(
      'Warning modal launcher not initialized. Ensure SyncModalLaunchers is mounted after OverlayProvider.',
    );
  }
};
