import * as React from 'react';
import { K8sResourceCommon, K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getReplicationControllersForResource, PodRCData } from '@console/shared/src';
import { VMIKind } from '../types/vm';
import { findVMIPod } from '../selectors/pod/selectors';
import * as models from '../models';

export const usePodsForVm = (
  vm: K8sResourceKind,
): { loaded: boolean; loadError: string; podData: PodRCData } => {
  const { namespace } = vm.metadata;
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [podData, setPodData] = React.useState<PodRCData>();

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
        kind: models.VirtualMachineInstanceModel.kind,
        namespace,
        optional: true,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  React.useEffect(() => {
    const errorKey = Object.keys(resources).find((key) => resources[key].loadError);
    if (errorKey) {
      setLoadError(resources[errorKey].loadError);
      return;
    }
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const { name } = vm.metadata;
      const vmis = resources.virtualmachineinstances.data;
      const vmi = vmis.find((instance) => instance.metadata.name === name) as VMIKind;
      const { visibleReplicationControllers } = getReplicationControllersForResource(vm, resources);
      const [current, previous] = visibleReplicationControllers;
      const launcherPod = findVMIPod(vmi, resources.pods.data as PodKind[]);
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
  }, [resources, vm]);

  return { loaded, loadError, podData };
};
