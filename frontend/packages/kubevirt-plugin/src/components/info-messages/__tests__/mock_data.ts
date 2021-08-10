import { VMIKind } from '../../../types';

export const mockData: { [key: string]: [VMIKind, boolean] } = {
  testWithoutVMOwner: [
    {
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachineInstance',
      metadata: {
        ownerReferences: [
          {
            apiVersion: 'kubevirt.io/v1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'some-kind',
            name: 'vm-example',
            uid: '03aec711-6673-417a-be03-2d7580b524ed',
          },
        ],
      },
      spec: {
        affinity: 'any',
        dnsConfig: 'any',
        dnsPolicy: 'string',
        hostname: 'string',
        livenessProbe: 'any',
        nodeSelector: { test: 'test' },
        readinessProbe: 'any',
        subdomain: 'string',
        terminationGracePeriodSeconds: 0,
        tolerations: [],
      },
      status: {
        conditions: [],
        interfaces: [],
        migrationMethod: 'string',
        migrationState: 'any',
        nodeName: 'string',
        phase: 'string',
        reason: 'string',
      },
    },
    true,
  ],
  testWithVMOwner: [
    {
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachineInstance',
      metadata: {
        ownerReferences: [
          {
            apiVersion: 'kubevirt.io/v1',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'VirtualMachine',
            name: 'vm-example',
            uid: '03aec711-6673-417a-be03-2d7580b524ed',
          },
        ],
      },
      spec: {
        affinity: 'any',
        dnsConfig: 'any',
        dnsPolicy: 'string',
        hostname: 'string',
        livenessProbe: 'any',
        nodeSelector: { test: 'test' },
        readinessProbe: 'any',
        subdomain: 'string',
        terminationGracePeriodSeconds: 0,
        tolerations: [],
      },
      status: {
        conditions: [],
        interfaces: [],
        migrationMethod: 'string',
        migrationState: 'any',
        nodeName: 'string',
        phase: 'string',
        reason: 'string',
      },
    },
    true,
  ],
  testNoVMILoadedTrue: [null, true],
  testLoadedFalse: [null, false],
};
