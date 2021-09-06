import { useMemo } from 'react';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { AddCapacityStorageSystem, CephStorageCSVActions } from './actions';
import {
  CephBlockPoolModel,
  NooBaaBucketClassModel,
  OCSServiceModel,
  StorageSystemModel,
} from '../models';

export const useCsvActions = ({ resource }) => {
  const [k8sModel, inFlight] = useK8sModel(referenceFor(resource));

  const actions = useMemo(
    () => [
      ...(referenceForModel(k8sModel) === referenceForModel(OCSServiceModel)
        ? [CephStorageCSVActions.AddCapacity(resource)]
        : []),
      ...(referenceForModel(k8sModel) === referenceForModel(CephBlockPoolModel)
        ? [CephStorageCSVActions.EditBlackPool(resource)]
        : []),
      ...(referenceForModel(k8sModel) === referenceForModel(NooBaaBucketClassModel)
        ? [CephStorageCSVActions.EditBucketClassResources(resource)]
        : []),
      ...(referenceForModel(k8sModel) === referenceForModel(StorageSystemModel)
        ? [AddCapacityStorageSystem(resource)]
        : []),
    ],
    [k8sModel, resource],
  );

  return useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};
