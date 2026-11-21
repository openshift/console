import type { MachineKind, MachineSetKind, NodeKind } from '@console/internal/module/k8s';
import {
  findMachineForMachineSet,
  getMachineConditions,
  getMachineNode,
  isClusterAPIResource,
} from '../machine';

describe('machine selectors', () => {
  describe('isClusterAPIResource', () => {
    it('returns true for cluster.x-k8s.io apiVersion', () => {
      expect(
        isClusterAPIResource({
          apiVersion: 'cluster.x-k8s.io/v1beta2',
          kind: 'Machine',
        }),
      ).toBe(true);
    });

    it('returns false for machine.openshift.io apiVersion', () => {
      expect(
        isClusterAPIResource({
          apiVersion: 'machine.openshift.io/v1beta1',
          kind: 'Machine',
        }),
      ).toBe(false);
    });
  });

  describe('getMachineConditions', () => {
    it('reads status.conditions for Cluster API Machines', () => {
      const conditions = [
        { type: 'Ready', status: 'True' },
        { type: 'Available', status: 'True' },
      ];
      const machine = {
        apiVersion: 'cluster.x-k8s.io/v1beta2',
        kind: 'Machine',
        status: {
          conditions,
          providerStatus: {
            conditions: [{ type: 'Ignored', status: 'False' }],
          },
        },
      } as MachineKind;

      expect(getMachineConditions(machine)).toEqual(conditions);
    });

    it('reads status.providerStatus.conditions for Machine API Machines', () => {
      const conditions = [{ type: 'Ready', status: 'True' }];
      const machine = {
        apiVersion: 'machine.openshift.io/v1beta1',
        kind: 'Machine',
        status: {
          conditions: [{ type: 'Ignored', status: 'False' }],
          providerStatus: { conditions },
        },
      } as MachineKind;

      expect(getMachineConditions(machine)).toEqual(conditions);
    });

    it('returns undefined when no conditions are present', () => {
      expect(
        getMachineConditions({
          apiVersion: 'cluster.x-k8s.io/v1beta2',
          kind: 'Machine',
        } as MachineKind),
      ).toBeUndefined();
    });
  });

  describe('getMachineNode', () => {
    const nodes = [
      { metadata: { name: 'node-a', uid: 'uid-a' } },
      { metadata: { name: 'node-b', uid: 'uid-b' } },
    ] as NodeKind[];

    it('matches Machine API nodeRef by uid', () => {
      const machine = {
        apiVersion: 'machine.openshift.io/v1beta1',
        status: { nodeRef: { kind: 'Node', name: 'node-a', uid: 'uid-b' } },
      } as MachineKind;

      expect(getMachineNode(machine, nodes)?.metadata.name).toBe('node-b');
    });

    it('matches Cluster API nodeRef by name when uid is absent', () => {
      const machine = {
        apiVersion: 'cluster.x-k8s.io/v1beta2',
        status: { nodeRef: { kind: 'Node', name: 'node-a' } },
      } as MachineKind;

      expect(getMachineNode(machine, nodes)?.metadata.name).toBe('node-a');
    });

    it('returns undefined when nodeRef is missing', () => {
      expect(
        getMachineNode({ apiVersion: 'cluster.x-k8s.io/v1beta2' } as MachineKind, nodes),
      ).toBeUndefined();
    });

    it('does not match when both names are missing/empty', () => {
      expect(
        getMachineNode(
          {
            apiVersion: 'cluster.x-k8s.io/v1beta2',
            status: { nodeRef: { kind: 'Node', name: '' } },
          } as MachineKind,
          [{ metadata: { name: '' } }] as NodeKind[],
        ),
      ).toBeUndefined();
    });
  });

  describe('findMachineForMachineSet', () => {
    const selector = { matchLabels: { role: 'worker' } };

    const machineSet = {
      apiVersion: 'cluster.x-k8s.io/v1beta2',
      kind: 'MachineSet',
      metadata: { name: 'workers', namespace: 'openshift-cluster-api' },
      spec: { selector, replicas: 1, template: { spec: {} } },
    } as MachineSetKind;

    it('selects a same-namespace CAPI Machine matching labels', () => {
      const machines = [
        {
          apiVersion: 'cluster.x-k8s.io/v1beta2',
          kind: 'Machine',
          metadata: {
            name: 'worker-a',
            namespace: 'openshift-cluster-api',
            labels: { role: 'worker' },
          },
        },
      ] as MachineKind[];

      expect(findMachineForMachineSet(machineSet, machines)?.metadata.name).toBe('worker-a');
    });

    it('ignores a matching-label Machine in another namespace', () => {
      const machines = [
        {
          apiVersion: 'cluster.x-k8s.io/v1beta2',
          kind: 'Machine',
          metadata: {
            name: 'other-ns',
            namespace: 'other-namespace',
            labels: { role: 'worker' },
          },
        },
      ] as MachineKind[];

      expect(findMachineForMachineSet(machineSet, machines)).toBeUndefined();
    });

    it('ignores Machine API Machines for a CAPI MachineSet', () => {
      const machines = [
        {
          apiVersion: 'machine.openshift.io/v1beta1',
          kind: 'Machine',
          metadata: {
            name: 'mapi-worker',
            namespace: 'openshift-cluster-api',
            labels: { role: 'worker' },
          },
        },
      ] as MachineKind[];

      expect(findMachineForMachineSet(machineSet, machines)).toBeUndefined();
    });

    it('returns undefined when MachineSet selector is missing', () => {
      expect(
        findMachineForMachineSet(
          {
            apiVersion: 'cluster.x-k8s.io/v1beta2',
            metadata: { namespace: 'openshift-cluster-api' },
            spec: { replicas: 1, template: { spec: {} } },
          } as MachineSetKind,
          [],
        ),
      ).toBeUndefined();
    });
  });
});
