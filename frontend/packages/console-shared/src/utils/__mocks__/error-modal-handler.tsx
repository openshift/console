/**
 * Mock implementation of error-modal-handler for Jest tests
 *
 * Note: This mock provides a simplified SyncModalLaunchers that doesn't call
 * useSyncWarningModalLauncher. Tests that need warning modal functionality
 * should explicitly mock warning-modal-handler or use the real implementation.
 */

export const mockLaunchErrorModal = jest.fn();

export const useSyncErrorModalLauncher = jest.fn();

export const useErrorModal = jest.fn(() => mockLaunchErrorModal);

// Simplified component that doesn't sync warning modals
// Tests needing both error and warning modals should not use this mock
export const SyncModalLaunchers = () => null;

export const launchErrorModal = mockLaunchErrorModal;
