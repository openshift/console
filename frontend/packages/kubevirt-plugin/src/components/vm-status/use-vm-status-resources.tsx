import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import {
  K8sKind,
  K8sResourceCommon,
  PersistentVolumeClaimKind,
  PodKind,
} from '@console/internal/module/k8s';
import { useDebounceCallback } from '../../hooks/use-debounce';
import { useDeepCompareMemoize } from '../../hooks/use-deep-compare-memoize';
import { DataVolumeModel, VirtualMachineInstanceMigrationModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { V1alpha1DataVolume } from '../../types/api';

export type VmStatusResourcesValue = {
  loaded: boolean;
  loadError: string;
  pods: PodKind[];
  migrations: K8sKind[];
  dvs: V1alpha1DataVolume[];
  pvcs: PersistentVolumeClaimKind[];
};

export const useVmStatusResources = (namespace: string): VmStatusResourcesValue => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [pods, setPods] = React.useState<PodKind[]>([]);
  const [migrations, setMigrations] = React.useState<K8sKind[]>([]);
  const [dvs, setDvs] = React.useState<V1alpha1DataVolume[]>([]);
  const [pvcs, setPvcs] = React.useState<PersistentVolumeClaimKind[]>([]);

  const watchedResources = {
    dvs: {
      kind: kubevirtReferenceForModel(DataVolumeModel),
      namespace,
      isList: true,
    },
    pods: {
      isList: true,
      kind: PodModel.kind,
      namespace,
    },
    pvcs: {
      kind: PersistentVolumeClaimModel.kind,
      namespace,
      isList: true,
    },
    migrations: {
      kind: kubevirtReferenceForModel(VirtualMachineInstanceMigrationModel),
      namespace,
      isList: true,
    },
  };

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  const updateResults = (updatedResources) => {
    const errorKey = Object.keys(updatedResources).find((key) => updatedResources[key].loadError);
    if (errorKey) {
      setLoadError(updatedResources[errorKey].loadError);
      return;
    }
    if (
      Object.keys(updatedResources).length > 0 &&
      Object.keys(updatedResources).every((key) => updatedResources[key].loaded)
    ) {
      setPods(updatedResources.pods.data);
      setMigrations(updatedResources.migrations.data);
      setDvs(updatedResources.dvs.data);
      setPvcs(updatedResources.pvcs.data);
      setLoaded(true);
      setLoadError(null);
    }
  };
  const debouncedUpdateResources = useDebounceCallback(updateResults, 250);

  React.useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({ pods, pvcs, dvs, migrations, loaded, loadError });
};
