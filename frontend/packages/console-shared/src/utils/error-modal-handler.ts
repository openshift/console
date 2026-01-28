import { useEffect } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal, ErrorModalProps } from '@console/internal/components/modals/error-modal';

// Module-level error modal launcher that can be set by root components
let globalErrorModalLauncher: ((props: ErrorModalProps) => void) | null = null;

export const setGlobalErrorModalLauncher = (
  launcher: ((props: ErrorModalProps) => void) | null,
) => {
  globalErrorModalLauncher = launcher;
};

export const launchGlobalErrorModal = (props: ErrorModalProps) => {
  if (globalErrorModalLauncher) {
    globalErrorModalLauncher(props);
  } else {
    // eslint-disable-next-line no-console
    console.error('Global error modal launcher not initialized:', props);
  }
};

/**
 * Hook that sets up a global error modal launcher for non-React contexts.
 * This should be called once in the root component of a package/feature.
 *
 * @example
 * ```tsx
 * const MyRootComponent = () => {
 *   useSetupGlobalErrorModalLauncher();
 *   // ... rest of component
 * };
 * ```
 */
export const useSetupGlobalErrorModalLauncher = () => {
  const launcher = useOverlay();

  useEffect(() => {
    const errorModalLauncher = (props: ErrorModalProps) => {
      launcher<ErrorModalProps>(ErrorModal, props);
    };

    setGlobalErrorModalLauncher(errorModalLauncher);

    return () => {
      setGlobalErrorModalLauncher(null);
    };
    // Intentionally only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
