import { render } from '@testing-library/react';
import { SyncModalLaunchers, launchErrorModal } from '../error-modal-handler';

// Mock useOverlay
const mockLauncher = jest.fn();
jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => mockLauncher,
}));

describe('error-modal-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SyncModalLaunchers', () => {
    it('should sync the launcher on mount', () => {
      render(<SyncModalLaunchers />);

      // Call the module-level function
      launchErrorModal({ error: 'Test error', title: 'Test' });

      // Should have called the mocked overlay launcher
      expect(mockLauncher).toHaveBeenCalledWith(expect.anything(), {
        error: 'Test error',
        title: 'Test',
      });
    });

    it('should cleanup launcher on unmount', () => {
      const { unmount } = render(<SyncModalLaunchers />);

      unmount();

      // Should throw error when launcher is not initialized
      expect(() => {
        launchErrorModal({ error: 'Test error' });
      }).toThrow('Error modal launcher not initialized');
    });
  });

  describe('launchErrorModal', () => {
    it('should launch error modal when launcher is initialized', () => {
      render(<SyncModalLaunchers />);

      launchErrorModal({
        error: 'Connection failed',
        title: 'Network Error',
      });

      expect(mockLauncher).toHaveBeenCalledWith(expect.anything(), {
        error: 'Connection failed',
        title: 'Network Error',
      });
    });

    it('should throw error when launcher is not initialized', () => {
      expect(() => {
        launchErrorModal({ error: 'Test error' });
      }).toThrow('Error modal launcher not initialized');
    });
  });
});
