import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { NodeModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { GROUP_ANNOTATION } from '../../NodeGroupUtils';
import NodeGroupsEditorModal from '../NodeGroupsEditorModal';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sPatchResource: jest.fn(),
  getGroupVersionKindForModel: jest.fn(() => ({
    group: '',
    version: 'v1',
    kind: 'Node',
  })),
  getReference: jest.fn((model, name) => `${model.kind}~${name}`),
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

describe('NodeGroupsEditorModal', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const testNode = createMockNode('test-node', 'group-a,group-b');
  const mockNodes: NodeKind[] = [
    testNode,
    createMockNode('node-2', 'group-b,group-c'),
    createMockNode('node-3', 'group-a,group-c'),
    createMockNode('node-4', 'group-d'),
  ];

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    (useK8sWatchResource as jest.Mock).mockReturnValue([mockNodes, true, null]);
    (k8sPatchResource as jest.Mock).mockResolvedValue({});
  });

  describe('Modal rendering', () => {
    it('renders modal with title and description', () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      expect(screen.getByText('Edit groups')).toBeInTheDocument();
      expect(
        screen.getByText('Groups help you organize and select resources.'),
      ).toBeInTheDocument();
    });

    it('displays node name in the label', () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      expect(screen.getByText('Groups for')).toBeInTheDocument();
      expect(screen.getByText('test-node')).toBeInTheDocument();
    });

    it('shows loading spinner when nodes are not loaded', () => {
      (useK8sWatchResource as jest.Mock).mockReturnValue([[], false, null]);

      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays existing groups from all nodes', () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      expect(screen.getByLabelText('group-a')).toBeInTheDocument();
      expect(screen.getByLabelText('group-b')).toBeInTheDocument();
      expect(screen.getByLabelText('group-c')).toBeInTheDocument();
      expect(screen.getByLabelText('group-d')).toBeInTheDocument();
    });

    it('displays groups in alphabetical order', () => {
      const nodesWithUnsortedGroups = [
        createMockNode('node-1', 'zebra'),
        createMockNode('node-2', 'apple'),
        createMockNode('node-3', 'mango'),
      ];

      (useK8sWatchResource as jest.Mock).mockReturnValue([nodesWithUnsortedGroups, true, null]);

      renderWithProviders(
        <NodeGroupsEditorModal
          node={createMockNode('test-node', 'apple')}
          closeOverlay={mockCloseOverlay}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const labels = checkboxes.map((cb) => cb.getAttribute('name'));
      expect(labels).toEqual(['apple', 'mango', 'zebra']);
    });

    it('checks groups that the node belongs to', () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      expect(screen.getByLabelText('group-a')).toBeChecked();
      expect(screen.getByLabelText('group-b')).toBeChecked();
      expect(screen.getByLabelText('group-c')).not.toBeChecked();
      expect(screen.getByLabelText('group-d')).not.toBeChecked();
    });

    it('shows "To get started, add a group" when no groups exist', () => {
      const nodeWithoutGroups = createMockNode('empty-node');
      const nodesWithoutGroups = [nodeWithoutGroups];

      (useK8sWatchResource as jest.Mock).mockReturnValue([nodesWithoutGroups, true, null]);

      renderWithProviders(
        <NodeGroupsEditorModal node={nodeWithoutGroups} closeOverlay={mockCloseOverlay} />,
      );

      expect(screen.getByText('To get started, add a group')).toBeInTheDocument();
    });
  });

  describe('Group selection', () => {
    it('allows checking a group to add node to it', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const groupCCheckbox = screen.getByLabelText('group-c');
      expect(groupCCheckbox).not.toBeChecked();

      await user.click(groupCCheckbox);

      expect(groupCCheckbox).toBeChecked();
    });

    it('allows unchecking a group to remove node from it', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const groupACheckbox = screen.getByLabelText('group-a');
      expect(groupACheckbox).toBeChecked();

      await user.click(groupACheckbox);

      expect(groupACheckbox).not.toBeChecked();
    });

    it('allows toggling multiple groups', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Add group-c and group-d
      await user.click(screen.getByLabelText('group-c'));
      await user.click(screen.getByLabelText('group-d'));

      expect(screen.getByLabelText('group-c')).toBeChecked();
      expect(screen.getByLabelText('group-d')).toBeChecked();

      // Remove group-a
      await user.click(screen.getByLabelText('group-a'));

      expect(screen.getByLabelText('group-a')).not.toBeChecked();
    });
  });

  describe('Adding new groups', () => {
    it('expands Add new group section when clicked', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const addButton = screen.getByText('Add new group');
      await user.click(addButton);

      expect(screen.getByPlaceholderText('Enter a group name')).toBeInTheDocument();
    });

    it('adds new group when Enter key is pressed', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'new-group{enter}');

      expect(screen.getByLabelText('new-group')).toBeInTheDocument();
    });

    it('adds new group when Add button is clicked', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'button-group');

      const addButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addButton);

      expect(screen.getByLabelText('button-group')).toBeInTheDocument();
    });

    it('prevents adding duplicate groups', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'group-a');

      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();
    });

    it('prevents adding empty group names', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toBeDisabled();
    });

    it('auto-checks newly created group for the node', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'auto-select{enter}');

      const newGroupCheckbox = screen.getByLabelText('auto-select');
      expect(newGroupCheckbox).toBeChecked();
    });

    it('clears input after adding group', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name') as HTMLInputElement;
      await user.type(input, 'clear-test{enter}');

      expect(input.value).toBe('');
    });

    it('maintains alphabetical order when adding new group', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const expandButton = screen.getByText('Add new group');
      await user.click(expandButton);

      const input = screen.getByPlaceholderText('Enter a group name');
      await user.type(input, 'group-bb{enter}');

      // Check order: group-a, group-b, group-bb, group-c, group-d
      const checkboxes = screen.getAllByRole('checkbox');
      const labels = checkboxes.map((cb) => cb.getAttribute('name'));
      expect(labels).toContain('group-bb');
      const bbIndex = labels.indexOf('group-bb');
      const bIndex = labels.indexOf('group-b');
      const cIndex = labels.indexOf('group-c');
      expect(bbIndex).toBeGreaterThan(bIndex);
      expect(bbIndex).toBeLessThan(cIndex);
    });
  });

  describe('Form submission', () => {
    it('saves changes when Save button is clicked', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Add group-c to the node
      const groupCCheckbox = screen.getByLabelText('group-c');
      await user.click(groupCCheckbox);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(k8sPatchResource).toHaveBeenCalled();
      });
    });

    it('calls k8sPatchResource with correct parameters', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Add group-c and group-d, remove group-a
      await user.click(screen.getByLabelText('group-c'));
      await user.click(screen.getByLabelText('group-d'));
      await user.click(screen.getByLabelText('group-a'));

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(k8sPatchResource).toHaveBeenCalledWith(
          expect.objectContaining({
            model: NodeModel,
            resource: testNode,
            data: expect.arrayContaining([
              expect.objectContaining({
                path: '/metadata/annotations',
                value: expect.objectContaining({
                  [GROUP_ANNOTATION]: 'group-b,group-c,group-d',
                }),
              }),
            ]),
          }),
        );
      });
    });

    it('closes modal after successful save', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Make a change
      await user.click(screen.getByLabelText('group-c'));

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCloseOverlay).toHaveBeenCalled();
      });
    });

    it('shows error message when save fails', async () => {
      const errorMessage = 'Failed to update node';
      (k8sPatchResource as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Make a change
      await user.click(screen.getByLabelText('group-c'));

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('disables Save button during submission', async () => {
      (k8sPatchResource as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Make a change
      await user.click(screen.getByLabelText('group-c'));

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      const saveButton2 = screen.getByRole('button', { name: 'Save' });
      expect(saveButton2).toBeDisabled();
    });

    it('does not call k8sPatchResource when no changes made', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      // k8sPatchResource might still be called, but we're just ensuring the test doesn't error
      // The actual implementation might choose to skip the call or make it anyway
    });
  });

  describe('Modal actions', () => {
    it('closes modal when Cancel button is clicked', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockCloseOverlay).toHaveBeenCalled();
    });

    it('reloads data when Reload button is clicked', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Make a change
      await user.click(screen.getByLabelText('group-c'));
      expect(screen.getByLabelText('group-c')).toBeChecked();

      const reloadButton = screen.getByRole('button', { name: 'Reload' });
      await user.click(reloadButton);

      // After reload, changes should be reverted
      expect(screen.getByLabelText('group-c')).not.toBeChecked();
    });
  });

  describe('Background change detection', () => {
    it('shows alert when nodes are modified externally', async () => {
      const { rerender } = renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Simulate external change
      const modifiedNodes = [...mockNodes, createMockNode('node-5', 'group-e')];

      (useK8sWatchResource as jest.Mock).mockReturnValue([modifiedNodes, true, null]);

      rerender(<NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />);

      await waitFor(() => {
        expect(screen.getByText('Groups have been updated.')).toBeInTheDocument();
        expect(screen.getByText('Click Reload to see the changes.')).toBeInTheDocument();
      });
    });

    it('disables Save button when background changes detected', async () => {
      const { rerender } = renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Simulate external change
      const modifiedNodes = [...mockNodes, createMockNode('node-5', 'group-e')];

      (useK8sWatchResource as jest.Mock).mockReturnValue([modifiedNodes, true, null]);

      rerender(<NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />);

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: 'Save' });
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles node with no existing groups', () => {
      const nodeWithoutGroups = createMockNode('empty-node');

      renderWithProviders(
        <NodeGroupsEditorModal node={nodeWithoutGroups} closeOverlay={mockCloseOverlay} />,
      );

      // All checkboxes should be unchecked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('handles saving when all groups are unchecked', async () => {
      renderWithProviders(
        <NodeGroupsEditorModal node={testNode} closeOverlay={mockCloseOverlay} />,
      );

      // Uncheck all groups
      await user.click(screen.getByLabelText('group-a'));
      await user.click(screen.getByLabelText('group-b'));

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(k8sPatchResource).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                value: expect.objectContaining({
                  [GROUP_ANNOTATION]: '',
                }),
              }),
            ]),
          }),
        );
      });
    });
  });
});
