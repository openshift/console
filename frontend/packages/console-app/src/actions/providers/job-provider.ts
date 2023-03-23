import * as React from 'react';
import { JobKind, CronJobKind, referenceFor } from '@console/internal/module/k8s';
import { useActiveCluster } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';
import { JobActionFactory } from '../creators/job-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useJobActionsProvider = (resource: JobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [cluster] = useActiveCluster();

  const actions = React.useMemo(
    () => [
      JobActionFactory.ModifyJobParallelism(kindObj, resource),
      ...pdbActions,
      ...getCommonResourceActions(kindObj, resource, undefined, cluster),
    ],
    [kindObj, resource, pdbActions, cluster],
  );

  return [actions, !inFlight, undefined];
};

export const useCronJobActionsProvider = (resource: CronJobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [cluster] = useActiveCluster();

  const actions = React.useMemo(
    () => [...pdbActions, ...getCommonResourceActions(kindObj, resource, undefined, cluster)],
    [cluster, kindObj, pdbActions, resource],
  );

  return [actions, !inFlight, undefined];
};
