import { useMemo } from 'react';
import type {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceCommon,
  K8sResourceKind,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import type { PodKind } from '@console/internal/module/k8s';
import { useAccessibleResources } from './useAccessibleResources';

export const VirtualMachineModel: K8sModel = {
  label: 'VirtualMachine',
  labelPlural: 'VirtualMachines',
  apiVersion: 'v1',
  apiGroup: 'kubevirt.io',
  plural: 'virtualmachines',
  abbr: 'VM',
  namespaced: true,
  kind: 'VirtualMachine',
  id: 'virtualmachine',
  crd: true,
};

export const DataVolumeModel: K8sModel = {
  abbr: 'DV',
  apiGroup: 'cdi.kubevirt.io',
  apiVersion: 'v1beta1',
  crd: true,
  id: 'datavolume',
  kind: 'DataVolume',
  label: 'DataVolume',
  labelPlural: 'DataVolumes',
  namespaced: true,
  plural: 'datavolumes',
};

// TODO: Remove VMI retrieval and VMs count column if/when the plugin is able to add the VMs count column
export const VirtualMachineInstanceGroupVersionKind: K8sGroupVersionKind = {
  group: 'kubevirt.io',
  kind: 'VirtualMachineInstance',
  version: 'v1',
};

export const useIsKubevirtPluginActive = () => {
  const kubevirtFeature = useFlag('KUBEVIRT_DYNAMIC');

  return (
    Array.isArray(window.SERVER_FLAGS?.consolePlugins) &&
    window.SERVER_FLAGS.consolePlugins.includes('kubevirt-plugin') &&
    kubevirtFeature
  );
};

// Return all matching VMIs, if no nodeName is given, return all VMIs.
export const filterVirtualMachineInstancesByNode = (vmis: K8sResourceKind[], nodeName?: string) =>
  vmis?.filter((vm) => !nodeName || vm.status?.nodeName === nodeName) ?? [];

// Watch VMIs and return all matching VMIs by nodeName if given, if not, return all VMIs.
export const useWatchVirtualMachineInstances = (
  nodeName?: string,
): WatchK8sResult<K8sResourceKind[]> => {
  const isKubevirtPluginActive = useIsKubevirtPluginActive();
  const [
    virtualMachineInstances,
    virtualMachineInstancesLoaded,
    virtualMachineInstancesLoadError,
  ] = useAccessibleResources(
    isKubevirtPluginActive
      ? {
          groupVersionKind: VirtualMachineInstanceGroupVersionKind,
          isList: true,
          namespaced: true,
        }
      : undefined,
  );

  const nodeVirtualMachineInstances = useMemo(
    () => filterVirtualMachineInstancesByNode(virtualMachineInstances, nodeName),
    [nodeName, virtualMachineInstances],
  );

  return [
    nodeVirtualMachineInstances,
    virtualMachineInstancesLoaded,
    virtualMachineInstancesLoadError,
  ];
};

export const isPodReady = (pod: PodKind): boolean =>
  pod?.status?.phase === 'Running' &&
  (pod?.status?.containerStatuses?.every((s) => s?.ready) ?? false);

export const getCurrentPod = (pods: PodKind[]) => {
  // Return the newest, most ready Pod created
  return [...pods].sort((a: PodKind, b: PodKind) => {
    const aReady = isPodReady(a);
    const bReady = isPodReady(b);
    if (aReady !== bReady) {
      return aReady ? -1 : 1;
    }
    return a.metadata.creationTimestamp > b.metadata.creationTimestamp ? -1 : 1;
  })[0];
};

export const getVMIPod = (vmi: K8sResourceCommon, pods: PodKind[]) => {
  if (!pods || !vmi) {
    return undefined;
  }

  const vmUID = vmi?.metadata?.uid;
  const prefixedPods = pods.filter((pod) => {
    const podOwnerReferences = pod?.metadata?.ownerReferences;
    return (
      pod?.metadata?.namespace === vmi?.metadata?.namespace &&
      podOwnerReferences &&
      podOwnerReferences?.some((podOwnerReference) => podOwnerReference?.uid === vmUID)
    );
  });

  // Return the newest, most ready Pod created
  return getCurrentPod(prefixedPods);
};
