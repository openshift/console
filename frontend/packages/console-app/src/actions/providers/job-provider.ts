import * as React from 'react';
import { JobKind, CronJobKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';
import { JobActionFactory } from '../creators/job-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const useJobActionsProvider = (resource: JobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);

  const actions = React.useMemo(
    () => [
      JobActionFactory.ModifyJobParallelism(kindObj, resource),
      ...pdbActions,
      ...getCommonResourceActions(kindObj, resource),
    ],
    [kindObj, resource, pdbActions],
  );

  return [actions, !inFlight, undefined];
};

export const useCronJobActionsProvider = (resource: CronJobKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);

  const actions = React.useMemo(
    () => [...pdbActions, ...getCommonResourceActions(kindObj, resource)],
    [kindObj, pdbActions, resource],
  );

  return [actions, !inFlight, undefined];
};
