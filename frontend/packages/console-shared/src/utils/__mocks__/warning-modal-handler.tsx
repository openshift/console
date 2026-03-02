/**
 * Mock for warning-modal-handler
 * Used in Jest tests to avoid rendering actual modals
 */

export const mockLaunchWarningModal = jest.fn((props, onConfirm) => {
  // Immediately call onConfirm by default to simulate user confirming
  onConfirm?.();
});

export const useSyncWarningModalLauncher = jest.fn();

export const launchWarningModal = mockLaunchWarningModal;
