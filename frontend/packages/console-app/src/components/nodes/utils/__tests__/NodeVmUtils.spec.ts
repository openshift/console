import { renderHook } from '@testing-library/react';
import type { K8sResourceCommon, K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import type { PodKind } from '@console/internal/module/k8s';
import {
  filterVirtualMachineInstancesByNode,
  getCurrentPod,
  getVMIPod,
  isPodReady,
  useIsKubevirtPluginActive,
  useWatchVirtualMachineInstances,
  VirtualMachineInstanceGroupVersionKind,
} from '../NodeVmUtils';

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

describe('NodeVmUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useIsKubevirtPluginActive', () => {
    it('should return true when kubevirt plugin is active', () => {
      useFlagMock.mockReturnValue(true);
      window.SERVER_FLAGS = {
        consolePlugins: ['kubevirt-plugin'],
      } as any;

      const { result } = renderHook(() => useIsKubevirtPluginActive());

      expect(result.current).toBe(true);
      expect(useFlagMock).toHaveBeenCalledWith('KUBEVIRT_DYNAMIC');
    });

    it('should return false when kubevirt plugin is not in the list', () => {
      useFlagMock.mockReturnValue(true);
      window.SERVER_FLAGS = {
        consolePlugins: ['other-plugin'],
      } as any;

      const { result } = renderHook(() => useIsKubevirtPluginActive());

      expect(result.current).toBe(false);
    });

    it('should return false when kubevirt feature flag is disabled', () => {
      useFlagMock.mockReturnValue(false);
      window.SERVER_FLAGS = {
        consolePlugins: ['kubevirt-plugin'],
      } as any;

      const { result } = renderHook(() => useIsKubevirtPluginActive());

      expect(result.current).toBe(false);
    });

    it('should return false when consolePlugins is not an array', () => {
      useFlagMock.mockReturnValue(true);
      window.SERVER_FLAGS = {} as any;

      const { result } = renderHook(() => useIsKubevirtPluginActive());

      expect(result.current).toBe(false);
    });
  });

  describe('filterVirtualMachineInstancesByNode', () => {
    const vmis = [
      {
        metadata: { name: 'vmi-1' },
        status: { nodeName: 'node-1' },
      },
      {
        metadata: { name: 'vmi-2' },
        status: { nodeName: 'node-2' },
      },
      {
        metadata: { name: 'vmi-3' },
        status: { nodeName: 'node-1' },
      },
    ] as K8sResourceKind[];

    it('should filter VMIs by node name', () => {
      const result = filterVirtualMachineInstancesByNode(vmis, 'node-1');

      expect(result).toHaveLength(2);
      expect(result[0].metadata.name).toBe('vmi-1');
      expect(result[1].metadata.name).toBe('vmi-3');
    });

    it('should return all VMIs when no nodeName is provided', () => {
      const result = filterVirtualMachineInstancesByNode(vmis);

      expect(result).toHaveLength(3);
    });

    it('should return empty array when VMIs is undefined', () => {
      const result = filterVirtualMachineInstancesByNode(undefined as any, 'node-1');

      expect(result).toEqual([]);
    });
  });

  describe('isPodReady', () => {
    it('should return true when pod is running and all containers are ready', () => {
      const pod = {
        status: {
          phase: 'Running',
          containerStatuses: [{ ready: true }, { ready: true }],
        },
      } as PodKind;

      expect(isPodReady(pod)).toBe(true);
    });

    it('should return false when pod is not running', () => {
      const pod = {
        status: {
          phase: 'Pending',
          containerStatuses: [{ ready: true }],
        },
      } as PodKind;

      expect(isPodReady(pod)).toBe(false);
    });

    it('should return false when some containers are not ready', () => {
      const pod = {
        status: {
          phase: 'Running',
          containerStatuses: [{ ready: true }, { ready: false }],
        },
      } as PodKind;

      expect(isPodReady(pod)).toBe(false);
    });

    it('should return false when pod has no container statuses', () => {
      const pod = {
        status: {
          phase: 'Running',
        },
      } as PodKind;

      expect(isPodReady(pod)).toBe(false);
    });
  });

  describe('getCurrentPod', () => {
    it('should return the most ready and newest pod', () => {
      const pods = [
        {
          metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
          status: { phase: 'Pending', containerStatuses: [{ ready: false }] },
        },
        {
          metadata: { creationTimestamp: '2024-01-03T00:00:00Z' },
          status: { phase: 'Running', containerStatuses: [{ ready: true }] },
        },
        {
          metadata: { creationTimestamp: '2024-01-02T00:00:00Z' },
          status: { phase: 'Running', containerStatuses: [{ ready: true }] },
        },
      ] as PodKind[];

      const result = getCurrentPod(pods);

      expect(result.metadata.creationTimestamp).toBe('2024-01-03T00:00:00Z');
    });

    it('should prioritize ready pods over newer non-ready pods', () => {
      const pods = [
        {
          metadata: { creationTimestamp: '2024-01-05T00:00:00Z' },
          status: { phase: 'Pending', containerStatuses: [{ ready: false }] },
        },
        {
          metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
          status: { phase: 'Running', containerStatuses: [{ ready: true }] },
        },
      ] as PodKind[];

      const result = getCurrentPod(pods);

      expect(result.metadata.creationTimestamp).toBe('2024-01-01T00:00:00Z');
    });

    it('should return the newest pod when none are ready', () => {
      const pods = [
        {
          metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
          status: { phase: 'Pending', containerStatuses: [{ ready: false }] },
        },
        {
          metadata: { creationTimestamp: '2024-01-03T00:00:00Z' },
          status: { phase: 'Pending', containerStatuses: [{ ready: false }] },
        },
      ] as PodKind[];

      const result = getCurrentPod(pods);

      expect(result.metadata.creationTimestamp).toBe('2024-01-03T00:00:00Z');
    });
  });

  describe('getVMIPod', () => {
    it('should find the pod owned by the VMI', () => {
      const vmi = {
        metadata: {
          uid: 'vmi-uid-1',
          namespace: 'test-namespace',
        },
      } as K8sResourceCommon;

      const pods = [
        {
          metadata: {
            namespace: 'test-namespace',
            creationTimestamp: '2024-01-01T00:00:00Z',
            ownerReferences: [{ uid: 'vmi-uid-1' }],
          },
          status: { phase: 'Running', containerStatuses: [{ ready: true }] },
        },
        {
          metadata: {
            namespace: 'test-namespace',
            creationTimestamp: '2024-01-02T00:00:00Z',
            ownerReferences: [{ uid: 'other-uid' }],
          },
          status: { phase: 'Running', containerStatuses: [{ ready: true }] },
        },
      ] as PodKind[];

      const result = getVMIPod(vmi, pods);

      expect(result?.metadata.ownerReferences?.[0].uid).toBe('vmi-uid-1');
    });

    it('should return undefined when VMI is undefined', () => {
      const pods = [
        {
          metadata: { namespace: 'test-namespace' },
        },
      ] as PodKind[];

      const result = getVMIPod(undefined as any, pods);

      expect(result).toBeUndefined();
    });

    it('should return undefined when pods is undefined', () => {
      const vmi = {
        metadata: { uid: 'vmi-uid-1', namespace: 'test-namespace' },
      } as K8sResourceCommon;

      const result = getVMIPod(vmi, undefined as any);

      expect(result).toBeUndefined();
    });

    it('should filter pods by namespace', () => {
      const vmi = {
        metadata: {
          uid: 'vmi-uid-1',
          namespace: 'test-namespace',
        },
      } as K8sResourceCommon;

      const pods = [
        {
          metadata: {
            namespace: 'other-namespace',
            ownerReferences: [{ uid: 'vmi-uid-1' }],
          },
        },
      ] as PodKind[];

      const result = getVMIPod(vmi, pods);

      expect(result).toBeUndefined();
    });
  });

  describe('useWatchVirtualMachineInstances', () => {
    beforeEach(() => {
      window.SERVER_FLAGS = {
        consolePlugins: ['kubevirt-plugin'],
      } as any;
    });

    it('should not watch resources when kubevirt plugin is not active', () => {
      useFlagMock.mockReturnValue(false);
      useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
      useK8sWatchResourcesMock.mockReturnValue({});

      renderHook(() => useWatchVirtualMachineInstances('node-1'));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(undefined);
    });

    it('should watch VMIs when kubevirt plugin is active', () => {
      useFlagMock.mockReturnValue(true);
      useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
      useK8sWatchResourcesMock.mockReturnValue({});

      renderHook(() => useWatchVirtualMachineInstances('node-1'));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
        isList: true,
        groupVersionKind: VirtualMachineInstanceGroupVersionKind,
        namespaced: true,
      });
    });

    it('should filter VMIs by node name', () => {
      useFlagMock.mockReturnValue(true);

      const vmis = [
        {
          metadata: { name: 'vmi-1' },
          status: { nodeName: 'node-1' },
        },
        {
          metadata: { name: 'vmi-2' },
          status: { nodeName: 'node-2' },
        },
      ];

      useK8sWatchResourceMock.mockReturnValue([vmis, true, undefined]);

      const { result } = renderHook(() => useWatchVirtualMachineInstances('node-1'));

      expect(result.current[0]).toHaveLength(1);
      expect(result.current[0][0].metadata.name).toBe('vmi-1');
      expect(result.current[1]).toBe(true);
      expect(result.current[2]).toBeUndefined();
    });
  });
});
