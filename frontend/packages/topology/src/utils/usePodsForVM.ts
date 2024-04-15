import * as React from 'react';
import { useK8sWatchResources } from '@console/dynamic-plugin-sdk/dist/core/lib/utils/k8s/hooks';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
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
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [podData, setPodData] = React.useState<PodRCData>();
  const vmName = vm.metadata.name;
  const vmRef = React.useRef<K8sResourceKind>(vm);

  const watchedResources = React.useMemo(
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

  const updateResults = React.useCallback(
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

  React.useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({ loaded, loadError, podData });
};
