import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NodeKind } from '@console/internal/module/k8s';
import * as nodesRequestModule from '../../../../k8s/requests/nodes';
import { isUnschedulableActive, MarkAsSchedulablePopover } from '../SchedulableStatus';

jest.mock('../../../../k8s/requests/nodes', () => ({
  makeNodeSchedulable: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
}));

jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => jest.fn(),
}));

const mockMakeNodeSchedulable = nodesRequestModule.makeNodeSchedulable as jest.Mock;

describe('SchedulableStatus', () => {
  const createMockNode = (unschedulable: boolean = false): NodeKind =>
    ({
      apiVersion: 'v1',
      kind: 'Node',
      metadata: {
        name: 'test-node',
      },
      spec: {
        unschedulable,
      },
    } as NodeKind);

  describe('isUnschedulableActive', () => {
    it('should return true when node is unschedulable', () => {
      const node = createMockNode(true);
      expect(isUnschedulableActive(node, {})).toBe(true);
    });

    it('should return false when node is schedulable', () => {
      const node = createMockNode(false);
      expect(isUnschedulableActive(node, {})).toBe(false);
    });

    it('should return false when unschedulable is undefined', () => {
      const node: NodeKind = {
        apiVersion: 'v1',
        kind: 'Node',
        metadata: { name: 'test-node' },
        spec: {},
      } as NodeKind;
      expect(isUnschedulableActive(node, {})).toBe(false);
    });
  });

  describe('MarkAsSchedulablePopover', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should display scheduling disabled status', () => {
      const node = createMockNode(true);
      render(<MarkAsSchedulablePopover node={node} resources={{}} />);

      expect(screen.getByText('Scheduling disabled')).toBeVisible();
    });

    it('should display explanation text', () => {
      const node = createMockNode(true);
      render(<MarkAsSchedulablePopover node={node} resources={{}} />);

      expect(
        screen.getByText(
          /No new Pods or workloads will be placed on this Node until it's marked as schedulable/,
        ),
      ).toBeVisible();
    });

    it('should display mark as schedulable button', () => {
      const node = createMockNode(true);
      render(<MarkAsSchedulablePopover node={node} resources={{}} />);

      expect(screen.getByRole('button', { name: 'Mark as schedulable' })).toBeVisible();
    });

    it('should call makeNodeSchedulable when button is clicked', async () => {
      const user = userEvent.setup();
      mockMakeNodeSchedulable.mockResolvedValue({});
      const node = createMockNode(true);
      render(<MarkAsSchedulablePopover node={node} resources={{}} />);

      const button = screen.getByRole('button', { name: 'Mark as schedulable' });
      await user.click(button);

      expect(mockMakeNodeSchedulable).toHaveBeenCalledWith(node);
    });
  });
});
