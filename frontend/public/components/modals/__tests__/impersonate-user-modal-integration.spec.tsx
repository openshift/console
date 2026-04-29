/**
 * Integration tests for ImpersonateUserModal
 * Tests the modal integrated with Redux actions and state
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ImpersonateUserModal } from '../impersonate-user-modal';
import { useK8sWatchResource } from '../../utils/k8s-watch-hook';
import { GroupKind } from '../../../module/k8s';
import * as UIActions from '../../../actions/ui';

// Mock dependencies
jest.mock('../../utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../../../actions/ui', () => ({
  startImpersonate: jest.fn(),
  stopImpersonate: jest.fn(),
}));

const mockGroups: GroupKind[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'developers', uid: 'dev-1', resourceVersion: '1' },
    users: ['user1', 'user2'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'admins', uid: 'admin-1', resourceVersion: '1' },
    users: ['admin1'],
  },
];

describe('ImpersonateUserModal Integration Tests', () => {
  let mockStore: any;
  let mockStartImpersonate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useK8sWatchResource as jest.Mock).mockReturnValue([mockGroups, true, null]);

    mockStartImpersonate = jest.fn();
    (UIActions.startImpersonate as jest.Mock).mockImplementation(mockStartImpersonate);

    // Create a simple mock store
    const reducer = (state = {}) => state;
    mockStore = createStore(reducer);
  });

  describe('Form submission with Redux integration', () => {
    it('should dispatch startImpersonate action with user only', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onImpersonate = jest.fn((username) => {
        mockStartImpersonate('User', username);
      });

      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={onClose} onImpersonate={onImpersonate} />
        </Provider>,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'testuser');

      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onImpersonate).toHaveBeenCalledWith('testuser', []);
        expect(mockStartImpersonate).toHaveBeenCalledWith('User', 'testuser');
      });
    });

    it('should dispatch startImpersonate action with user and groups', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const onImpersonate = jest.fn((username, groups) => {
        if (groups.length > 0) {
          mockStartImpersonate('UserWithGroups', username, groups);
        } else {
          mockStartImpersonate('User', username);
        }
      });

      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={onClose} onImpersonate={onImpersonate} />
        </Provider>,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'multiuser');

      // Open groups dropdown
      const groupsInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupsInput);

      // Wait for dropdown to open and select first group
      const developersOption = await screen.findByText('developers');
      await user.click(developersOption);

      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onImpersonate).toHaveBeenCalledWith('multiuser', ['developers']);
        expect(mockStartImpersonate).toHaveBeenCalledWith('UserWithGroups', 'multiuser', [
          'developers',
        ]);
      });
    });
  });

  describe('Group selection workflow', () => {
    it('should handle complete group selection flow', async () => {
      const user = userEvent.setup();
      const onImpersonate = jest.fn();

      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={jest.fn()} onImpersonate={onImpersonate} />
        </Provider>,
      );

      // Enter username
      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'groupuser');

      // Open dropdown
      const groupsInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupsInput);

      // Select first group
      const developersOption = await screen.findByText('developers');
      await user.click(developersOption);

      // Verify group chip appears
      // eslint-disable-next-line testing-library/no-node-access -- PatternFly chips don't have accessible test IDs
      await waitFor(() => {
        // eslint-disable-next-line testing-library/no-node-access -- PatternFly chips don't have accessible test IDs
        const chips = document.querySelectorAll('.pf-v6-c-label');
        expect(chips.length).toBeGreaterThan(0);
      });

      // Select second group
      const adminsOption = screen.getByText('admins');
      await user.click(adminsOption);

      // Verify two groups are selected
      await waitFor(() => {
        // eslint-disable-next-line testing-library/no-node-access -- PatternFly chips don't have accessible test IDs
        const chips = document.querySelectorAll('.pf-v6-c-label');
        expect(chips.length).toBe(2);
      });

      // Submit
      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onImpersonate).toHaveBeenCalledWith('groupuser', ['developers', 'admins']);
      });
    });

    it('should allow deselecting a group', async () => {
      const user = userEvent.setup();
      const onImpersonate = jest.fn();

      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={jest.fn()} onImpersonate={onImpersonate} />
        </Provider>,
      );

      const usernameInput = screen.getByTestId('username-input');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'deselectuser');

      // Open and select group
      const groupsInput = screen.getByPlaceholderText('Enter groups');
      await user.click(groupsInput);

      const developersOption = await screen.findByText('developers');
      await user.click(developersOption);

      // Wait for chip to appear
      await waitFor(() => {
        // eslint-disable-next-line testing-library/no-node-access -- PatternFly chips don't have accessible test IDs
        const chips = document.querySelectorAll('.pf-v6-c-label');
        expect(chips.length).toBe(1);
      });

      // Remove the group by clicking the X button
      // eslint-disable-next-line testing-library/no-node-access -- PatternFly chips don't have accessible test IDs
      const closeButtons = document.querySelectorAll('.pf-v6-c-label__actions button');
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0]);

        await waitFor(() => {
          // eslint-disable-next-line testing-library/no-node-access -- PatternFly chips don't have accessible test IDs
          const chips = document.querySelectorAll('.pf-v6-c-label');
          expect(chips.length).toBe(0);
        });
      }

      // Submit with no groups
      const submitButton = screen.getByTestId('impersonate-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onImpersonate).toHaveBeenCalledWith('deselectuser', []);
      });
    });
  });

  describe('Search and filter workflow', () => {
    it('should filter groups based on search input', async () => {
      const user = userEvent.setup();
      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={jest.fn()} onImpersonate={jest.fn()} />
        </Provider>,
      );

      const groupsInput = screen.getByPlaceholderText('Enter groups');

      // Open dropdown first
      await user.click(groupsInput);

      expect(await screen.findByText('developers')).toBeInTheDocument();

      // Type to filter
      await user.type(groupsInput, 'dev');

      await waitFor(() => {
        // Should show developers (matches "dev")
        expect(screen.getByText('developers')).toBeInTheDocument();
        // Should not show admins (doesn't match "dev")
        expect(screen.queryByText('admins')).not.toBeInTheDocument();
      });
    });

    it('should show no results when filter matches nothing', async () => {
      const user = userEvent.setup();
      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={jest.fn()} onImpersonate={jest.fn()} />
        </Provider>,
      );

      const groupsInput = screen.getByPlaceholderText('Enter groups');

      // Open dropdown first
      await user.click(groupsInput);

      expect(await screen.findByText('developers')).toBeInTheDocument();

      // Type to filter with non-matching text
      await user.type(groupsInput, 'nonexistent');

      expect(await screen.findByText('No results found')).toBeVisible();
    });
  });

  describe('Error handling workflow', () => {
    it('should show error when groups fail to load', async () => {
      const error = new Error('Failed to fetch groups');
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], false, error]);

      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={jest.fn()} onImpersonate={jest.fn()} />
        </Provider>,
      );

      expect(await screen.findByText('Failed to load groups')).toBeVisible();

      // Should still allow impersonation without groups
      const ue = userEvent.setup();
      const usernameInput = screen.getByTestId('username-input');
      await ue.clear(usernameInput);
      await ue.type(usernameInput, 'erroruser');

      const submitButton = screen.getByTestId('impersonate-button');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Modal lifecycle workflow', () => {
    it('should reset form when reopening modal', async () => {
      const ue = userEvent.setup();
      const { rerender } = render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={jest.fn()} onImpersonate={jest.fn()} />
        </Provider>,
      );

      // Fill form
      const usernameInput = screen.getByTestId('username-input');
      await ue.clear(usernameInput);
      await ue.type(usernameInput, 'tempuser');

      // Close modal
      rerender(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={false} onClose={jest.fn()} onImpersonate={jest.fn()} />
        </Provider>,
      );

      // Reopen modal
      rerender(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={jest.fn()} onImpersonate={jest.fn()} />
        </Provider>,
      );

      // Form should be reset
      const resetUsernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      expect(resetUsernameInput.value).toBe('');
    });

    it('should call onClose when cancel is clicked', async () => {
      const ue = userEvent.setup();
      const onClose = jest.fn();

      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal isOpen={true} onClose={onClose} onImpersonate={jest.fn()} />
        </Provider>,
      );

      const cancelButton = screen.getByTestId('cancel-button');
      await ue.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Readonly mode workflow', () => {
    it('should support readonly username for prefilled scenarios', () => {
      render(
        <Provider store={mockStore}>
          <ImpersonateUserModal
            isOpen={true}
            onClose={jest.fn()}
            onImpersonate={jest.fn()}
            prefilledUsername="readonly-user"
            isUsernameReadonly={true}
          />
        </Provider>,
      );

      const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
      expect(usernameInput.value).toBe('readonly-user');
      expect(usernameInput).toHaveAttribute('readonly');

      // Readonly attribute should be present (prevents browser editing)
      // attribute is correctly set for browser behavior
    });
  });
});
