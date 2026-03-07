import { render } from '@testing-library/react';
import { useSyncWarningModalLauncher, launchWarningModal } from '../warning-modal-handler';

// Mock useOverlay
const mockLauncher = jest.fn();
jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => mockLauncher,
}));

describe('warning-modal-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSyncWarningModalLauncher', () => {
    it('should sync the launcher on mount', () => {
      const TestComponent = () => {
        useSyncWarningModalLauncher();
        return null;
      };

      render(<TestComponent />);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      // Call the module-level function
      launchWarningModal(
        {
          title: 'Test Warning',
          children: 'Are you sure?',
          confirmButtonLabel: 'Confirm',
        },
        onConfirm,
        onCancel,
      );

      // Should have called the mocked overlay launcher
      expect(mockLauncher).toHaveBeenCalledWith(expect.anything(), {
        title: 'Test Warning',
        children: 'Are you sure?',
        confirmButtonLabel: 'Confirm',
        onConfirm: expect.any(Function),
        onClose: expect.any(Function),
      });
    });

    it('should cleanup launcher on unmount', () => {
      const TestComponent = () => {
        useSyncWarningModalLauncher();
        return null;
      };

      const { unmount } = render(<TestComponent />);

      unmount();

      // Should throw error when launcher is not initialized
      expect(() => {
        launchWarningModal(
          {
            title: 'Test Warning',
            children: 'Are you sure?',
          },
          jest.fn(),
        );
      }).toThrow('Warning modal launcher not initialized');
    });
  });

  describe('launchWarningModal', () => {
    it('should launch warning modal when launcher is initialized', () => {
      const TestComponent = () => {
        useSyncWarningModalLauncher();
        return null;
      };

      render(<TestComponent />);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      launchWarningModal(
        {
          title: 'Delete Resource',
          children: 'Are you sure you want to delete?',
          confirmButtonLabel: 'Delete',
        },
        onConfirm,
        onCancel,
      );

      expect(mockLauncher).toHaveBeenCalledWith(expect.anything(), {
        title: 'Delete Resource',
        children: 'Are you sure you want to delete?',
        confirmButtonLabel: 'Delete',
        onConfirm: expect.any(Function),
        onClose: expect.any(Function),
      });
    });

    it('should throw error when launcher is not initialized', () => {
      expect(() => {
        launchWarningModal(
          {
            title: 'Test',
            children: 'Test message',
          },
          jest.fn(),
        );
      }).toThrow('Warning modal launcher not initialized');
    });

    it('should call onConfirm callback when user confirms', () => {
      const TestComponent = () => {
        useSyncWarningModalLauncher();
        return null;
      };

      render(<TestComponent />);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      launchWarningModal(
        {
          title: 'Confirm Action',
          children: 'Proceed?',
        },
        onConfirm,
        onCancel,
      );

      // Get the onConfirm callback that was passed to the launcher
      const launcherCall = mockLauncher.mock.calls[0];
      const launcherProps = launcherCall[1];
      launcherProps.onConfirm();

      expect(onConfirm).toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel callback when user cancels', () => {
      const TestComponent = () => {
        useSyncWarningModalLauncher();
        return null;
      };

      render(<TestComponent />);

      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      launchWarningModal(
        {
          title: 'Confirm Action',
          children: 'Proceed?',
        },
        onConfirm,
        onCancel,
      );

      // Get the onClose callback that was passed to the launcher
      const launcherCall = mockLauncher.mock.calls[0];
      const launcherProps = launcherCall[1];
      launcherProps.onClose();

      expect(onCancel).toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should handle optional callbacks gracefully', () => {
      const TestComponent = () => {
        useSyncWarningModalLauncher();
        return null;
      };

      render(<TestComponent />);

      // Call without callbacks
      expect(() => {
        launchWarningModal({
          title: 'Info',
          children: 'Just showing info',
        });
      }).not.toThrow();

      expect(mockLauncher).toHaveBeenCalled();

      // Verify calling the callbacks doesn't throw
      const launcherCall = mockLauncher.mock.calls[0];
      const launcherProps = launcherCall[1];

      expect(() => {
        launcherProps.onConfirm();
        launcherProps.onClose();
      }).not.toThrow();
    });
  });
});
