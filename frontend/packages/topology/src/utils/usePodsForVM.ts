import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useK8sWatchResources } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResources';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { PodModel, ReplicationControllerModel } from '@console/internal/models';
import { K8sResourceCommon, K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import {
  getReplicationControllersForResource,
  useDebounceCallback,
  useDeepCompareMemoize,
} from '@console/shared';
import { VirtualMachineInstanceModel } from './kubevirt-models';
import { VMIKind } from './kubevirt-types';
import { findVMIPod } from './kubevirt-utils';
import { PodRCData } from './pod-utils';

export const usePodsForVm = (
  vm: K8sResourceKind,
): { loaded: boolean; loadError: string; podData: PodRCData } => {
  const { namespace } = vm.metadata;
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [podData, setPodData] = useState<PodRCData>();
  const vmName = vm.metadata.name;
  const vmRef = useRef<K8sResourceKind>(vm);

  const watchedResources = useMemo(
    () => ({
      replicationControllers: {
        isList: true,
        groupVersionKind: getGroupVersionKindForModel(ReplicationControllerModel),
        namespace,
      },
      pods: {
        isList: true,
        groupVersionKind: getGroupVersionKindForModel(PodModel),
        namespace,
      },
      virtualmachineinstances: {
        isList: true,
        groupVersionKind: getGroupVersionKindForModel(VirtualMachineInstanceModel),
        namespace,
        optional: true,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  const updateResults = useCallback(
    (updatedResources) => {
      const errorKey = Object.keys(updatedResources).find((key) => updatedResources[key].loadError);
      if (errorKey) {
        setLoadError(updatedResources[errorKey].loadError);
        return;
      }
      if (
        Object.keys(updatedResources).length > 0 &&
        Object.keys(updatedResources).every((key) => updatedResources[key].loaded)
      ) {
        const vmis = updatedResources.virtualmachineinstances.data;
        const vmi = vmis.find((instance) => instance.metadata.name === vmName) as VMIKind;
        const { visibleReplicationControllers } = getReplicationControllersForResource(
          vmRef.current,
          updatedResources,
        );
        const [current, previous] = visibleReplicationControllers;
        const launcherPod = findVMIPod(vmi, updatedResources.pods.data as PodKind[]);
        const podRCData: PodRCData = {
          current,
          previous,
          isRollingOut: false,
          pods: launcherPod ? [launcherPod] : [],
          obj: vm,
        };
        setLoaded(true);
        setLoadError(null);
        setPodData(podRCData);
      }
    },
    // Don't update on a resource change, we want the debounce callback to be consistent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vmName],
  );

  const debouncedUpdateResources = useDebounceCallback(updateResults, 250);

  useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({ loaded, loadError, podData });
};
