import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectModel } from '@console/dynamic-plugin-sdk/src/models';
import type { GroupKind } from '../../../module/k8s';
import { useK8sWatchResource } from '../../utils/k8s-watch-hook';
import { ImpersonateUserModal } from '../impersonate-user-modal';

// Mock the k8s watch hook
jest.mock('../../utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

// Stub NsDropdown: emits a fixed namespace selection on click
jest.mock('../../utils/list-dropdown', () => ({
  NsDropdown: ({
    selectedKey,
    onChange,
    dataTest,
  }: {
    selectedKey?: string;
    dataTest?: string;
    onChange: (key: string, kind?: string, resource?: { metadata: { name: string } }) => void;
  }) => (
    <button
      type="button"
      data-test={dataTest}
      onClick={() => onChange('test-ns', 'Project', { metadata: { name: 'test-ns' } })}
    >
      {selectedKey || 'Select project'}
    </button>
  ),
  useProjectOrNamespaceModel: () => [ProjectModel, true] as const,
}));

// Stub ResourceDropdown: emits a fixed service account selection on click
jest.mock('@console/shared/src/components/dropdown/ResourceDropdown', () => ({
  ResourceDropdown: ({
    selectedKey,
    onChange,
    dataTest,
    disabled,
    placeholder,
  }: {
    selectedKey?: string | null;
    dataTest?: string;
    disabled?: boolean;
    placeholder?: string;
    onChange: (key: string, name?: string, resource?: { metadata: { name: string } }) => void;
  }) => (
    <button
      type="button"
      data-test={dataTest}
      disabled={disabled}
      onClick={() => onChange('builder', 'builder', { metadata: { name: 'builder' } })}
    >
      {selectedKey || placeholder}
    </button>
  ),
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

const mockServiceAccounts = [
  {
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: { name: 'builder', namespace: 'test-ns', uid: 'sa-1', resourceVersion: '1' },
  },
  {
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: { name: 'deployer', namespace: 'test-ns', uid: 'sa-2', resourceVersion: '1' },
  },
];

describe('ImpersonateUserModal', () => {
  const mockOnClose = jest.fn();
  const mockOnImpersonate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: groups and service accounts loaded successfully
    (useK8sWatchResource as jest.Mock).mockImplementation((resource) => {
      if (!resource) {
        return [[], true, null];
      }
      if (resource.groupVersionKind?.kind === 'ServiceAccount') {
        return [mockServiceAccounts, true, null];
      }
      return [mockGroups, true, null];
    });
  });

  describe('Basic Rendering', () => {
    it('should render modal when open', () => {
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
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
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const usernameInput = screen.getByTestId('username-input');
      expect(usernameInput).toBeInTheDocument();
      expect(usernameInput).toHaveAttribute('type', 'text');
    });

    it('should render groups multi-select field', () => {
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      expect(screen.getByPlaceholderText('Enter groups')).toBeInTheDocument();
    });
  });

  describe('Username Input', () => {
    it('should allow typing username', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');

      expect(usernameInput.value).toBe('testuser');
    });

    it('should pre-fill username when provided', () => {
      render(
        <ImpersonateUserModal
          isOpen
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
          isOpen
          onClose={mockOnClose}
          onImpersonate={mockOnImpersonate}
          prefilledUsername="readonly-user"
          isUsernameReadonly
        />,
      );

      const usernameInput = screen.getByTestId('username-input');
      expect(usernameInput).toHaveAttribute('readonly');
    });

    it('should show error when username is empty on submit', async () => {
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
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
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Groups should not be available yet
      expect(screen.getByPlaceholderText('Enter groups')).toBeInTheDocument();
    });

    it('should gracefully handle group load errors without showing error alert', () => {
      const error = new Error('Model does not exist');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], false, error]);

      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Should NOT show error alert — free-form entry is available instead
      expect(screen.queryByText('Failed to load groups')).not.toBeInTheDocument();
      // Should show helper text for manual entry
      expect(
        screen.getByText('Type group names manually. Press Enter to add each group.'),
      ).toBeInTheDocument();
    });
  });

  describe('Free-form Group Entry', () => {
    it('should add a group on Enter key press', async () => {
      const user = userEvent.setup();
      // Groups model unavailable
      const error = new Error('Model does not exist');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, error]);

      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.type(groupInput, 'my-custom-group{Enter}');

      // Group chip should appear
      await waitFor(() => {
        expect(screen.getByText('my-custom-group')).toBeInTheDocument();
      });
    });

    it('should add multiple free-form groups', async () => {
      const user = userEvent.setup();
      const error = new Error('Model does not exist');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, error]);

      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.type(groupInput, 'group-a{Enter}');
      await user.type(groupInput, 'group-b{Enter}');

      await waitFor(() => {
        expect(screen.getByText('group-a')).toBeInTheDocument();
        expect(screen.getByText('group-b')).toBeInTheDocument();
      });
    });

    it('should not add duplicate groups on Enter', async () => {
      const user = userEvent.setup();
      const error = new Error('Model does not exist');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, error]);

      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.type(groupInput, 'my-group{Enter}');
      await user.type(groupInput, 'my-group{Enter}');

      await waitFor(() => {
        // eslint-disable-next-line testing-library/no-node-access -- checking chip count
        const chips = document.querySelectorAll('.pf-v6-c-label');
        expect(chips.length).toBe(1);
      });
    });

    it('should show "Create" option in dropdown for new group name', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.type(groupInput, 'new-custom-group');

      await waitFor(() => {
        expect(screen.getByText('Create "new-custom-group"')).toBeInTheDocument();
      });
    });

    it('should add group via "Create" option click', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.type(groupInput, 'new-custom-group');

      const createOption = await screen.findByText('Create "new-custom-group"');
      await user.click(createOption);

      await waitFor(() => {
        // eslint-disable-next-line testing-library/no-node-access -- checking chip appearance
        const chips = document.querySelectorAll('.pf-v6-c-label');
        expect(chips.length).toBe(1);
      });
    });

    it('should submit free-form groups with onImpersonate', async () => {
      const user = userEvent.setup();
      const error = new Error('Model does not exist');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, error]);

      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.type(groupInput, 'oidc-admins{Enter}');
      await user.type(groupInput, 'oidc-developers{Enter}');

      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith(
          'testuser',
          ['oidc-admins', 'oidc-developers'],
          'User',
        );
      });
    });

    it('should not add a group via Enter when it case-insensitively matches an available group', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');

      // Type "Admins" (differs in case from available "admins" group)
      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.type(groupInput, 'Admins{Enter}');

      // Submit — "Admins" should NOT have been added as a free-form group
      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith('testuser', [], 'User');
      });
    });

    it('should allow Select all to toggle correctly after adding a freeform group', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // First select all API groups (known working pattern)
      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      expect(await screen.findByText('Select all')).toBeVisible();
      await user.click(screen.getByText('Select all'));

      // Add a freeform group via Create option
      await user.type(groupInput, 'custom-freeform');
      const createOption = await screen.findByText('Create "custom-freeform"');
      await user.click(createOption);

      // Verify freeform group chip appears
      await waitFor(() => {
        expect(screen.getByText('custom-freeform')).toBeInTheDocument();
      });

      // Submit and check all groups (freeform + API) are included
      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');
      await user.click(screen.getByTestId('impersonate-button'));

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith(
          'testuser',
          expect.arrayContaining(['custom-freeform', 'admins', 'developers', 'testers']),
          'User',
        );
        expect(mockOnImpersonate.mock.calls[0][1]).toHaveLength(4);
      });
    });

    it('should keep freeform group when removing API groups via chip close buttons', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Select an API group
      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.click(await screen.findByText('admins'));

      // Add a freeform group via Create option
      await user.type(groupInput, 'custom-freeform');
      const createOption = await screen.findByText('Create "custom-freeform"');
      await user.click(createOption);

      // Verify both chips exist
      await waitFor(() => {
        expect(screen.getByText('custom-freeform')).toBeInTheDocument();
      });

      // Remove the API group via chip close button
      await user.click(screen.getByRole('button', { name: /close.*admins/i }));

      // Submit — should only have freeform group
      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');
      await user.click(screen.getByTestId('impersonate-button'));

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith('testuser', ['custom-freeform'], 'User');
      });
    });

    it('should show hint text when model unavailable and no text typed', async () => {
      const user = userEvent.setup();
      const error = new Error('Model does not exist');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, error]);

      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);

      await waitFor(() => {
        expect(screen.getByText('Type a group name and press Enter')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onImpersonate with username only when no groups selected', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith('testuser', [], 'User');
      });
    });

    it('should trim whitespace from username', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, '  testuser  ');

      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith('testuser', [], 'User');
      });
    });

    it('should call onImpersonate with service account username and groups', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      await user.click(screen.getByTestId('impersonate-kind-service-account'));

      // Select namespace and service account from the dropdowns
      await user.click(screen.getByTestId('service-account-namespace-dropdown'));
      await user.click(screen.getByTestId('service-account-name-dropdown'));

      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);
      await user.click(await screen.findByText('developers'));

      await user.click(screen.getByTestId('impersonate-button'));

      await waitFor(() => {
        expect(mockOnImpersonate).toHaveBeenCalledWith(
          'system:serviceaccount:test-ns:builder',
          ['developers'],
          'ServiceAccount',
        );
      });
    });

    it('should disable the service account name dropdown until a namespace is selected', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      await user.click(screen.getByTestId('impersonate-kind-service-account'));
      expect(screen.getByTestId('service-account-name-dropdown')).toBeDisabled();

      await user.click(screen.getByTestId('service-account-namespace-dropdown'));
      expect(screen.getByTestId('service-account-name-dropdown')).toBeEnabled();
    });

    it('should clear the selected service account when the namespace changes', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      await user.click(screen.getByTestId('impersonate-kind-service-account'));
      await user.click(screen.getByTestId('service-account-namespace-dropdown'));

      const nameDropdown = screen.getByTestId('service-account-name-dropdown');
      await user.click(nameDropdown);
      expect(nameDropdown).toHaveTextContent('builder');

      // Selecting the namespace again resets the previously selected service account
      await user.click(screen.getByTestId('service-account-namespace-dropdown'));
      expect(nameDropdown).toHaveTextContent('Select a service account');
    });

    it('should watch service accounts for the selected namespace only', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      await user.click(screen.getByTestId('impersonate-kind-service-account'));

      // No cluster-wide watch before a namespace is chosen
      expect(useK8sWatchResource).toHaveBeenLastCalledWith(null);

      await user.click(screen.getByTestId('service-account-namespace-dropdown'));

      expect(useK8sWatchResource).toHaveBeenLastCalledWith(
        expect.objectContaining({
          groupVersionKind: expect.objectContaining({ kind: 'ServiceAccount' }),
          namespace: 'test-ns',
          isList: true,
        }),
      );
    });

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed and reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Enter username
      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');

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
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
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
          isOpen
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
          isOpen
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
      const user = userEvent.setup();
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
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Open dropdown and select all 5 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);

      expect(await screen.findByText('Select all')).toBeVisible();

      await user.click(screen.getByText('Select all'));

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
      const user = userEvent.setup();
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
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Open dropdown and select all 8 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);

      expect(await screen.findByText('Select all')).toBeVisible();

      await user.click(screen.getByText('Select all'));

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
      const user = userEvent.setup();
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
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Open dropdown and select all 7 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);

      expect(await screen.findByText('Select all')).toBeVisible();

      await user.click(screen.getByText('Select all'));

      // Wait for "+2" button to appear
      expect(await screen.findByText('+2')).toBeVisible();

      // Click the "+2" button to expand
      await user.click(screen.getByText('+2'));

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
      const user = userEvent.setup();
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
        <ImpersonateUserModal isOpen onClose={mockOnClose} onImpersonate={mockOnImpersonate} />,
      );

      // Select all 6 groups
      const groupInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupInput);

      expect(await screen.findByText('Select all')).toBeVisible();

      await user.click(screen.getByText('Select all'));

      // Expand to show all groups
      expect(await screen.findByText('+1')).toBeVisible();
      await user.click(screen.getByText('+1'));

      expect(await screen.findByText('group6')).toBeVisible();

      await user.click(screen.getByRole('button', { name: /close.*group6/i }));

      // Now only 5 groups remain, so it should collapse automatically
      await waitFor(() => {
        expect(screen.queryByText('group6')).not.toBeInTheDocument();
        // "+N" button should not be visible anymore
        expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
      });
    });
  });
});
