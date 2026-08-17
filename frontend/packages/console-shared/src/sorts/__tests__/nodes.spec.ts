import type { NodeKind, Taint } from '@console/internal/module/k8s';
import { nodeReadiness } from '../nodes';

jest.mock('@console/internal/actions/ui', () => ({
  getNodeMetric: jest.fn(),
}));
jest.mock('@console/app/src/components/nodes/csr', () => ({
  isCSRResource: jest.fn(),
}));
jest.mock('@console/internal/components/factory/Table/sort', () => ({
  sortResourceByValue: jest.fn(),
}));

const readyCondition = (status: 'True' | 'False' | 'Unknown') => ({
  type: 'Ready',
  status,
});

const createNode = ({
  readyStatus,
  unschedulable = false,
  taints,
}: {
  readyStatus?: 'True' | 'False' | 'Unknown';
  unschedulable?: boolean;
  taints?: Taint[];
} = {}): NodeKind =>
  ({
    apiVersion: 'v1',
    kind: 'Node',
    metadata: { name: 'test-node' },
    spec: {
      unschedulable,
      taints,
    },
    status: {
      conditions: readyStatus ? [readyCondition(readyStatus)] : [],
    },
  }) as NodeKind;

describe('nodeReadiness', () => {
  it.each([
    ['Ready', { readyStatus: 'True' as const }, 'True|0|0'],
    ['Not Ready', { readyStatus: 'False' as const }, 'False|0|0'],
    ['Unknown Ready status', { readyStatus: 'Unknown' as const }, 'Unknown|0|0'],
    ['missing Ready condition defaults to Unknown', {}, 'Unknown|0|0'],
    ['Ready + unschedulable', { readyStatus: 'True' as const, unschedulable: true }, 'True|1|0'],
    [
      'default control-plane taint does not change the key',
      {
        readyStatus: 'True' as const,
        taints: [{ key: 'node-role.kubernetes.io/control-plane', value: '', effect: 'NoSchedule' }],
      },
      'True|0|0',
    ],
    [
      'default master taint does not change the key',
      {
        readyStatus: 'True' as const,
        taints: [{ key: 'node-role.kubernetes.io/master', value: '', effect: 'NoSchedule' }],
      },
      'True|0|0',
    ],
    [
      'extra NoSchedule taint changes the key',
      {
        readyStatus: 'True' as const,
        taints: [{ key: 'dedicated', value: 'infra', effect: 'NoSchedule' }],
      },
      'True|0|1',
    ],
    [
      'extra NoExecute taint changes the key',
      {
        readyStatus: 'True' as const,
        taints: [{ key: 'dedicated', value: 'infra', effect: 'NoExecute' }],
      },
      'True|0|1',
    ],
  ])('%s', (_name, nodeOpts, expected) => {
    expect(nodeReadiness(createNode(nodeOpts))).toBe(expected);
  });

  it('splits Ready vs Not Ready so they do not share a sort key', () => {
    const ready = nodeReadiness(createNode({ readyStatus: 'True' }));
    const notReady = nodeReadiness(createNode({ readyStatus: 'False' }));
    expect(ready).not.toBe(notReady);
    expect(ready.startsWith('True|')).toBe(true);
    expect(notReady.startsWith('False|')).toBe(true);
  });

  it('sorts Ready + unschedulable after Ready + schedulable', () => {
    const schedulable = nodeReadiness(createNode({ readyStatus: 'True' }));
    const unschedulable = nodeReadiness(createNode({ readyStatus: 'True', unschedulable: true }));
    expect(schedulable < unschedulable).toBe(true);
  });
});
