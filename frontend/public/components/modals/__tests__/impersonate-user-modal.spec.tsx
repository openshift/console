import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImpersonateUserModal } from '../impersonate-user-modal';
import { useK8sWatchResource } from '../../utils/k8s-watch-hook';
import { GroupKind } from '../../../module/k8s';

// Mock the k8s watch hook
jest.mock('../../utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockGroups: GroupKind[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'dev-1',
      resourceVersion: '1',
    },
    users: ['user1', 'user2'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'admins',
      uid: 'admin-1',
      resourceVersion: '1',
    },
    users: ['admin1'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'testers',
      uid: 'test-1',
      resourceVersion: '1',
    },
    users: ['tester1'],
  },
];

describe('ImpersonateUserModal', () => {
  const mockOnClose = jest.fn();
  const mockOnImpersonate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: groups loaded successfully
    (useK8sWatchResource as jest.Mock).mockReturnValue([mockGroups, true, null]);
  });

  describe('Basic Rendering', () => {
    it('should render modal when open', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Modal renders in a portal, so use screen queries
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter groups')).toBeInTheDocument();
      expect(screen.getByTestId('impersonate-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <ImpersonateUserModal
          isOpen={false}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      expect(screen.queryByTestId('username-input')).not.toBeInTheDocument();
    });

    it('should render username input field', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      const usernameInput = screen.getByTestId('username-input');
      expect(usernameInput).toBeInTheDocument();
      expect(usernameInput).toHaveAttribute('type', 'text');
    });

    it('should render groups multi-select field', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      expect(screen.getByPlaceholderText('Enter groups')).toBeInTheDocument();
    });
  });

  describe('Username Input', () => {
    it('should allow typing username', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      expect(usernameInput.value).toBe('testuser');
    });

    it('should pre-fill username when provided', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
          prefilledUsername="prefilleduser"
        />,
      );

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      expect(usernameInput.value).toBe('prefilleduser');
    });

    it('should make username readonly when specified', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
          prefilledUsername="readonly-user"
          isUsernameReadonly={true}
        />,
      );

      const usernameInput = screen.getByTestId('username-input');
      expect(usernameInput).toHaveAttribute('readonly');
    });

    it('should show error when username is empty on submit', async () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      const submitButton = screen.getByTestId('impersonate-button');

      // Button should be disabled when username is empty
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Group Loading States', () => {
    it('should show loading state while groups are loading', () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], false, null]);

      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Groups should not be available yet
      expect(screen.getByPlaceholderText('Enter groups')).toBeInTheDocument();
    });

    it('should show error alert when groups fail to load', () => {
      const error = new Error('Failed to load groups');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], false, error]);

      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Check for alert with danger variant
      const alerts = screen.getAllByText('Failed to load groups');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Form Submission', () => {
    it('should call onImpersonate with username only when no groups selected', async () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      const usernameInput = screen.getByTestId('username-input');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const submitButton = screen.getByTestId('impersonate-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith('testuser', []);
      });
    });

    it('should trim whitespace from username', async () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      const usernameInput = screen.getByTestId('username-input');
      fireEvent.change(usernameInput, { target: { value: '  testuser  ' } });

      const submitButton = screen.getByTestId('impersonate-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith('testuser', []);
      });
    });

    it('should close modal after successful submission', async () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      const usernameInput = screen.getByTestId('username-input');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      const submitButton = screen.getByTestId('impersonate-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed and reopened', () => {
      const { rerender } = render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Enter username
      const usernameInput = screen.getByTestId('username-input');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      // Close modal
      rerender(
        <ImpersonateUserModal
          isOpen={false}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Reopen modal
      rerender(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Username should be reset
      const resetUsernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      expect(resetUsernameInput.value).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long usernames', () => {
      const longUsername = 'a'.repeat(100);
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
          prefilledUsername={longUsername}
        />,
      );

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      expect(usernameInput.value).toBe(longUsername);
    });

    it('should handle special characters in username', () => {
      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
          prefilledUsername="user@domain.com"
        />,
      );

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      expect(usernameInput.value).toBe('user@domain.com');
    });
  });

  describe('Expandable Groups (More than 5 selected)', () => {
    it('should show all groups when 5 or fewer are selected', async () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([
        [
          { metadata: { name: 'group1' } },
          { metadata: { name: 'group2' } },
          { metadata: { name: 'group3' } },
          { metadata: { name: 'group4' } },
          { metadata: { name: 'group5' } },
        ],
        true,
        null,
      ]);

      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Open dropdown and select all 5 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      fireEvent.click(groupInput);

      await waitFor(() => {
        expect(screen.getByText('Select all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select all'));

      // All 5 groups should be visible as chips
      await waitFor(() => {
        expect(screen.getAllByText('group1').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group2').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group3').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group4').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group5').length).toBeGreaterThanOrEqual(1);
      });

      // Should NOT show the "+N" expand button
      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it('should hide groups beyond 5 and show "+N" button when more than 5 groups selected', async () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([
        [
          { metadata: { name: 'group1' } },
          { metadata: { name: 'group2' } },
          { metadata: { name: 'group3' } },
          { metadata: { name: 'group4' } },
          { metadata: { name: 'group5' } },
          { metadata: { name: 'group6' } },
          { metadata: { name: 'group7' } },
          { metadata: { name: 'group8' } },
        ],
        true,
        null,
      ]);

      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Open dropdown and select all 8 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      fireEvent.click(groupInput);

      await waitFor(() => {
        expect(screen.getByText('Select all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select all'));

      // First 5 groups should be visible as chips
      await waitFor(() => {
        expect(screen.getAllByText('group1').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group2').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group3').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group4').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('group5').length).toBeGreaterThanOrEqual(1);
      });

      // Groups 6, 7, 8 should be in dropdown but only group 6,7,8 chips should not be visible
      // (they appear in dropdown menu but not as chips)
      const group6Elements = screen.getAllByText('group6');
      const group7Elements = screen.getAllByText('group7');
      const group8Elements = screen.getAllByText('group8');

      // Should have exactly 1 occurrence each (in dropdown menu only, not as chips)
      expect(group6Elements.length).toBe(1);
      expect(group7Elements.length).toBe(1);
      expect(group8Elements.length).toBe(1);

      // Should show "+3" button (8 - 5 = 3 remaining)
      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('should expand and show all groups when "+N" button is clicked', async () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([
        [
          { metadata: { name: 'group1' } },
          { metadata: { name: 'group2' } },
          { metadata: { name: 'group3' } },
          { metadata: { name: 'group4' } },
          { metadata: { name: 'group5' } },
          { metadata: { name: 'group6' } },
          { metadata: { name: 'group7' } },
        ],
        true,
        null,
      ]);

      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Open dropdown and select all 7 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      fireEvent.click(groupInput);

      await waitFor(() => {
        expect(screen.getByText('Select all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select all'));

      // Wait for "+2" button to appear
      await waitFor(() => {
        expect(screen.getByText('+2')).toBeInTheDocument();
      });

      // Click the "+2" button to expand
      fireEvent.click(screen.getByText('+2'));

      // Now all 7 groups should be visible
      await waitFor(() => {
        expect(screen.getByText('group1')).toBeInTheDocument();
        expect(screen.getByText('group2')).toBeInTheDocument();
        expect(screen.getByText('group3')).toBeInTheDocument();
        expect(screen.getByText('group4')).toBeInTheDocument();
        expect(screen.getByText('group5')).toBeInTheDocument();
        expect(screen.getByText('group6')).toBeInTheDocument();
        expect(screen.getByText('group7')).toBeInTheDocument();
      });

      // "+2" button should no longer be visible
      expect(screen.queryByText('+2')).not.toBeInTheDocument();
    });

    it('should collapse back when groups are removed to 5 or fewer', async () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([
        [
          { metadata: { name: 'group1' } },
          { metadata: { name: 'group2' } },
          { metadata: { name: 'group3' } },
          { metadata: { name: 'group4' } },
          { metadata: { name: 'group5' } },
          { metadata: { name: 'group6' } },
        ],
        true,
        null,
      ]);

      render(
        <ImpersonateUserModal
          isOpen={true}
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
        />,
      );

      // Select all 6 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      fireEvent.click(groupInput);

      await waitFor(() => {
        expect(screen.getByText('Select all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select all'));

      // Expand to show all groups
      await waitFor(() => {
        expect(screen.getByText('+1')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('+1'));

      await waitFor(() => {
        expect(screen.getByText('group6')).toBeInTheDocument();
      });

      // Remove one group using the close button on the chip
      const group6Chip = screen.getByText('group6').closest('.pf-v6-c-label');
      const closeButton = group6Chip?.querySelector('button');
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton!);

      // Now only 5 groups remain, so it should collapse automatically
      await waitFor(() => {
        expect(screen.queryByText('group6')).not.toBeInTheDocument();
        // "+N" button should not be visible anymore
        expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
      });
    });
  });
});
