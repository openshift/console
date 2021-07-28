import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceCommon, K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { useDebounceCallback } from '../hooks/use-debounce';
import { useDeepCompareMemoize } from '../hooks/use-deep-compare-memoize';
import * as models from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { findVMIPod } from '../selectors/pod/selectors';
import { PodRCData } from '../types/pod';
import { VMIKind } from '../types/vm';
import { getReplicationControllersForResource } from './resource-utils';

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
        kind: 'ReplicationController',
        namespace,
      },
      pods: {
        isList: true,
        kind: 'Pod',
        namespace,
      },
      virtualmachineinstances: {
        isList: true,
        kind: kubevirtReferenceForModel(models.VirtualMachineInstanceModel),
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
