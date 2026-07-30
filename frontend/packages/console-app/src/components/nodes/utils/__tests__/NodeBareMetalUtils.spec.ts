import { renderHook } from '@testing-library/react';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import type { MachineKind } from '@console/internal/module/k8s';
import {
  BAREMETAL_FLAG,
  BareMetalHostGroupVersionKind,
  findBareMetalHostByNode,
  getHostMachine,
  metricsFromBareMetalHosts,
  useIsBareMetalPluginActive,
  useWatchBareMetalHost,
} from '../NodeBareMetalUtils';

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks', () => ({
  useK8sWatchResource: jest.fn(),
  useK8sWatchResources: jest.fn(),
}));

const useFlagMock = useFlag as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

describe('NodeBareMetalUtils', () => {
  describe('useIsBareMetalPluginActive', () => {
    it('should return the value of BAREMETAL flag', () => {
      useFlagMock.mockReturnValue(true);
      const { result } = renderHook(() => useIsBareMetalPluginActive());
      expect(result.current).toBe(true);
      expect(useFlagMock).toHaveBeenCalledWith(BAREMETAL_FLAG);
    });

    it('should return false when BAREMETAL flag is false', () => {
      useFlagMock.mockReturnValue(false);
      const { result } = renderHook(() => useIsBareMetalPluginActive());
      expect(result.current).toBe(false);
    });
  });

  describe('getHostMachine', () => {
    it('should find the machine that matches the host consumerRef', () => {
      const host = {
        spec: {
          consumerRef: {
            name: 'machine-1',
          },
        },
      } as K8sResourceKind;

      const machines = [
        {
          metadata: {
            name: 'machine-1',
          },
        },
        {
          metadata: {
            name: 'machine-2',
          },
        },
      ] as MachineKind[];

      const result = getHostMachine(host, machines);
      expect(result).toBe(machines[0]);
    });

    it('should return undefined when no matching machine is found', () => {
      const host = {
        spec: {
          consumerRef: {
            name: 'machine-3',
          },
        },
      } as K8sResourceKind;

      const machines = [
        {
          metadata: {
            name: 'machine-1',
          },
        },
      ] as MachineKind[];

      const result = getHostMachine(host, machines);
      expect(result).toBeUndefined();
    });

    it('should handle empty machines array', () => {
      const host = {
        spec: {
          consumerRef: {
            name: 'machine-1',
          },
        },
      } as K8sResourceKind;

      const result = getHostMachine(host, []);
      expect(result).toBeUndefined();
    });
  });

  describe('findBareMetalHostByNode', () => {
    it('should find the bare metal host associated with a node', () => {
      const node = {
        metadata: {
          annotations: {
            'machine.openshift.io/machine': 'openshift-machine-api/machine-1',
          },
        },
      } as Partial<NodeKind>;

      const machines = [
        {
          metadata: {
            name: 'machine-1',
            namespace: 'openshift-machine-api',
            uid: 'machine-uid-1',
          },
        },
      ] as MachineKind[];

      const hosts = [
        {
          spec: {
            consumerRef: {
              name: 'machine-1',
            },
          },
        },
      ] as K8sResourceKind[];

      const result = findBareMetalHostByNode(hosts, machines, node as NodeKind);
      expect(result).toBe(hosts[0]);
    });

    it('should return undefined when node has no machine annotation', () => {
      const node = {
        metadata: {
          annotations: {},
        },
      } as NodeKind;

      const result = findBareMetalHostByNode([], [], node);
      expect(result).toBeUndefined();
    });

    it('should return undefined when machine is not found', () => {
      const node = {
        metadata: {
          annotations: {
            'machine.openshift.io/machine': 'openshift-machine-api/machine-1',
          },
        },
      } as Partial<NodeKind>;

      const result = findBareMetalHostByNode([], [], node as NodeKind);
      expect(result).toBeUndefined();
    });
  });

  describe('useWatchBareMetalHost', () => {
    const node = {
      metadata: {
        name: 'node-1',
        annotations: {
          'machine.openshift.io/machine': 'openshift-machine-api/machine-1',
        },
      },
    } as Partial<NodeKind>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should not watch resources when bare metal plugin is not active', () => {
      useFlagMock.mockReturnValue(false);
      useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
      useK8sWatchResourcesMock.mockReturnValue({});

      renderHook(() => useWatchBareMetalHost(node as NodeKind));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(undefined);
    });

    it('should watch bare metal hosts and machines when plugin is active', () => {
      useFlagMock.mockReturnValue(true);
      useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);

      renderHook(() => useWatchBareMetalHost(node as NodeKind));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        isList: true,
        groupVersionKind: BareMetalHostGroupVersionKind,
        namespaced: true,
      });
    });

    it('should return bare metal host when found', () => {
      useFlagMock.mockReturnValue(true);

      const machines = [
        {
          metadata: {
            name: 'machine-1',
            namespace: 'openshift-machine-api',
            uid: 'machine-uid-1',
          },
        },
      ];

      const hosts = [
        {
          spec: {
            consumerRef: {
              name: 'machine-1',
            },
          },
        },
      ];

      useK8sWatchResourceMock.mockImplementation((initResource) => {
        // useAccessibleResources calls useK8sWatchResource twice per resource: first with null (projects), then with initResource
        if (!initResource) {
          return [[], true, undefined];
        }
        if (initResource.groupVersionKind === BareMetalHostGroupVersionKind) {
          return [hosts, true, undefined];
        }
        return [machines, true, undefined];
      });

      const { result } = renderHook(() => useWatchBareMetalHost(node as NodeKind));

      expect(result.current[0]).toBe(hosts[0]);
      expect(result.current[1]).toBe(true);
      expect(result.current[2]).toBe(undefined);
    });

    it('should return error when loading fails', () => {
      useFlagMock.mockReturnValue(true);
      const error = new Error('Failed to load');

      useK8sWatchResourceMock.mockReturnValue([[], false, error]);
      useK8sWatchResourcesMock.mockReturnValue({});

      const { result } = renderHook(() => useWatchBareMetalHost(node as NodeKind));

      expect(result.current[0]).toBe(undefined);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(error);
    });
  });

  describe('metricsFromBareMetalHosts', () => {
    it('should extract metrics from bare metal host', () => {
      const host = {
        status: {
          hardware: {
            storage: [{}, {}],
            nics: [{}, {}, {}],
            cpu: {
              count: 8,
            },
          },
        },
      } as K8sResourceKind;

      const result = metricsFromBareMetalHosts(host);

      expect(result).toEqual({
        disks: 2,
        nics: 3,
        cpus: 8,
      });
    });

    it('should handle undefined bare metal host', () => {
      const result = metricsFromBareMetalHosts(undefined);

      expect(result).toEqual({
        disks: undefined,
        nics: undefined,
        cpus: undefined,
      });
    });

    it('should handle missing hardware status', () => {
      const host = {
        status: {},
      } as K8sResourceKind;

      const result = metricsFromBareMetalHosts(host);

      expect(result).toEqual({
        disks: undefined,
        nics: undefined,
        cpus: undefined,
      });
    });
  });
});
