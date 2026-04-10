import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { NodeModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { GROUP_ANNOTATION } from '../../NodeGroupUtils';
import GroupsEditorModal from '../GroupsEditorModal';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sPatchResource: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.replace(/^[^~]+~/, ''),
    i18n: { language: 'en' },
  }),
  withTranslation: () => (component) => component,
  Trans: ({ children }) => children,
}));

const mockCloseOverlay = jest.fn();

const createMockNode = (name: string, groups?: string): NodeKind =>
  ({
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name,
      ...(groups && {
        annotations: {
          [GROUP_ANNOTATION]: groups,
        },
      }),
    },
    spec: {},
    status: {},
  } as NodeKind);

describe('GroupsEditorModal', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockNodes: NodeKind[] = [
    createMockNode('node-1', 'group-a,group-b'),
    createMockNode('node-2', 'group-b,group-c'),
    createMockNode('node-3', 'group-a'),
    createMockNode('node-4'), // No groups
  ];

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    (useK8sWatchResource as jest.Mock).mockReturnValue([mockNodes, true, null]);
    (k8sPatchResource as jest.Mock).mockResolvedValue({});
  });

  describe('Modal rendering', () => {
    it('renders modal with title and description', () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      expect(screen.getByText('Edit groups')).toBeInTheDocument();
      expect(
        screen.getByText('Groups help you organize and select resources.'),
      ).toBeInTheDocument();
    });

    it('shows loading spinner when nodes are not loaded', () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], false, null]);

      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows empty state when no nodes exist', () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], true, null]);

      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      expect(screen.getByText('No existing nodes')).toBeInTheDocument();
      expect(
        screen.getByText('You can create groups only when there are existing nodes.'),
      ).toBeInTheDocument();
    });

    it('displays existing groups from nodes', () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      expect(screen.getByText('group-a')).toBeInTheDocument();
      expect(screen.getByText('group-b')).toBeInTheDocument();
      expect(screen.getByText('group-c')).toBeInTheDocument();
    });

    it('displays groups in alphabetical order', () => {
      const nodesWithUnsortedGroups = [
        createMockNode('node-1', 'zebra'),
        createMockNode('node-2', 'apple'),
        createMockNode('node-3', 'mango'),
      ];

      (useK8sWatchResource as jest.Mock).mockReturnValue([nodesWithUnsortedGroups, true, null]);

      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const groupItems = screen.getAllByRole('button', { name: /^(apple|mango|zebra)$/ });
      expect(groupItems[0]).toHaveTextContent('apple');
      expect(groupItems[1]).toHaveTextContent('mango');
      expect(groupItems[2]).toHaveTextContent('zebra');
    });

    it('shows "To get started, add a group" when no groups exist', () => {
      const nodesWithoutGroups = [createMockNode('node-1'), createMockNode('node-2')];

      (useK8sWatchResource as jest.Mock).mockReturnValue([nodesWithoutGroups, true, null]);

      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      expect(screen.getByText('To get started, add a group')).toBeInTheDocument();
    });
  });

  describe('Group selection', () => {
    it('allows selecting a group', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      const groupAButton2 = screen.getByRole('button', { name: 'group-a' });
      expect(groupAButton2).toHaveClass('pf-m-current');
    });

    it('displays nodes for selected group', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      expect(screen.getByText('Nodes for group group-a')).toBeInTheDocument();

      // Nodes in group-a should be checked
      const node1Checkbox = screen.getByLabelText('node-1');
      const node3Checkbox = screen.getByLabelText('node-3');

      expect(node1Checkbox).toBeChecked();
      expect(node3Checkbox).toBeChecked();
    });

    it('allows adding nodes to a group', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      // node-4 is not in group-a initially
      const node4Checkbox = screen.getByLabelText('node-4');
      expect(node4Checkbox).not.toBeChecked();

      await user.click(node4Checkbox);

      expect(node4Checkbox).toBeChecked();
    });

    it('allows removing nodes from a group', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      const node1Checkbox = screen.getByLabelText('node-1');
      expect(node1Checkbox).toBeChecked();

      await user.click(node1Checkbox);

      expect(node1Checkbox).not.toBeChecked();
    });
  });

  describe('Adding new groups', () => {
    it('expands Add new group section when clicked', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const addButton = screen.getByText('Add new group');
      await user.click(addButton);

      expect(screen.getByPlaceholderText('Enter a group name')).toBeInTheDocument();
    });

    it('adds new group when Enter key is pressed', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const addButton = screen.getByText('Add new group');
      await user.click(addButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'new-group{enter}');

      expect(screen.getByText('new-group')).toBeInTheDocument();
    });

    it('adds new group when Add button is clicked', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'button-group');

      const addButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addButton);

      expect(screen.getByText('button-group')).toBeInTheDocument();
    });

    it('prevents adding duplicate groups', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'group-a');

      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();
    });

    it('prevents adding empty group names', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();
    });

    it('auto-selects newly created group', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'auto-select{enter}');

      const newGroupButton = screen.getByRole('button', { name: 'auto-select' });
      expect(newGroupButton).toHaveClass('pf-m-current');
    });

    it('clears input after adding group', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name') as HTMLInputElement;
      await user.type(input, 'clear-test{enter}');

      expect(input.value).toBe('');
    });
  });

  describe('Deleting groups', () => {
    it('removes group when trash icon is clicked', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Uninterpolated mock t() gives identical delete labels; groups are sorted, so index 0 is group-a.
      const deleteGroupAButton = screen.getAllByRole('button', {
        name: 'Delete group {{groupName}}',
      })[0];

      await user.click(deleteGroupAButton);

      expect(screen.queryByText('group-a')).not.toBeInTheDocument();
    });

    it('deselects group when it is deleted', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Select group-a
      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      expect(screen.getByText('Nodes for group group-a')).toBeInTheDocument();

      // Delete group-a
      const deleteGroupAButton = screen.getAllByRole('button', {
        name: 'Delete group {{groupName}}',
      })[0];
      await user.click(deleteGroupAButton);

      // Should no longer show nodes for deleted group
      expect(screen.queryByText('Nodes for group group-a')).not.toBeInTheDocument();
      expect(screen.getByText('Select a group')).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('saves changes when Save button is clicked', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Select group-a and add node-4 to it
      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      const node4Checkbox = screen.getByLabelText('node-4');
      await user.click(node4Checkbox);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(k8sPatchResource).toHaveBeenCalled();
      });
    });

    it('calls k8sPatchResource with correct parameters for modified nodes', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Add node-4 to group-a
      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      const node4Checkbox = screen.getByLabelText('node-4');
      await user.click(node4Checkbox);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(k8sPatchResource).toHaveBeenCalledWith(
          expect.objectContaining({
            model: NodeModel,
            resource: expect.objectContaining({
              metadata: expect.objectContaining({
                name: 'node-4',
              }),
            }),
            data: expect.arrayContaining([
              expect.objectContaining({
                path: '/metadata/annotations',
                value: expect.objectContaining({
                  [GROUP_ANNOTATION]: 'group-a',
                }),
              }),
            ]),
          }),
        );
      });
    });

    it('does not call k8sPatchResource for unmodified nodes', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      // Since no changes were made, k8sPatchResource should not be called
      await waitFor(() => {
        expect(k8sPatchResource).not.toHaveBeenCalled();
      });
    });

    it('closes modal after successful save', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Make a change
      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      const node4Checkbox = screen.getByLabelText('node-4');
      await user.click(node4Checkbox);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCloseOverlay).toHaveBeenCalled();
      });
    });

    it('shows error message when save fails', async () => {
      const errorMessage = 'Failed to update node';
      (k8sPatchResource as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Make a change
      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      const node4Checkbox = screen.getByLabelText('node-4');
      await user.click(node4Checkbox);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      const detailsButton = await waitFor(() => {
        return screen.getByRole('button', { name: 'Show details' });
      });

      await user.click(detailsButton);

      expect(screen.getByText('Error updating {{nodeName}}')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('disables Save button during submission', async () => {
      (k8sPatchResource as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Make a change
      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      const node4Checkbox = screen.getByLabelText('node-4');
      await user.click(node4Checkbox);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      expect(saveButton).toBeDisabled();
    });
  });

  describe('Modal actions', () => {
    it('closes modal when Cancel button is clicked', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('reloads data when Reload button is clicked', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const reloadButton = screen.getByRole('button', { name: 'Reload' });
      await user.click(reloadButton);

      // After reload, selected group should be cleared
      expect(screen.getByText('Select a group')).toBeInTheDocument();
    });
  });

  describe('Background change detection', () => {
    it('shows alert when nodes are modified externally', async () => {
      const { rerender } = renderWithProviders(
        <GroupsEditorModal closeOverlay={mockCloseOverlay} />,
      );

      // Simulate external change
      const modifiedNodes = [...mockNodes, createMockNode('node-5', 'group-d')];

      (useK8sWatchResource as jest.Mock).mockReturnValue([modifiedNodes, true, null]);

      rerender(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      await waitFor(() => {
        expect(screen.getByText('Groups have been updated.')).toBeInTheDocument();
        expect(screen.getByText('Click Reload to see the changes.')).toBeInTheDocument();
      });
    });

    it('disables Save button when background changes detected', async () => {
      const { rerender } = renderWithProviders(
        <GroupsEditorModal closeOverlay={mockCloseOverlay} />,
      );

      // Simulate external change
      const modifiedNodes = [...mockNodes, createMockNode('node-5', 'group-d')];

      (useK8sWatchResource as jest.Mock).mockReturnValue([modifiedNodes, true, null]);

      rerender(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: 'Save' });
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Node list updates', () => {
    it('updates node checkboxes when switching groups', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      // Select group-a
      const groupAButton = screen.getByRole('button', { name: 'group-a' });
      await user.click(groupAButton);

      expect(screen.getByLabelText('node-1')).toBeChecked();
      expect(screen.getByLabelText('node-3')).toBeChecked();

      // Select group-b
      const groupBButton = screen.getByRole('button', { name: 'group-b' });
      await user.click(groupBButton);

      expect(screen.getByLabelText('node-1')).toBeChecked();
      expect(screen.getByLabelText('node-2')).toBeChecked();
    });

    it('disables checkboxes when no group is selected', async () => {
      renderWithProviders(<GroupsEditorModal closeOverlay={mockCloseOverlay} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });
  });
});
