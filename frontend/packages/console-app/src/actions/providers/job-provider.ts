import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';
import { JobActionFactory } from '../creators/job-factory';

export const useJobActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const actions = React.useMemo(
    () => [
      JobActionFactory.ModifyJobParallelism(kindObj, resource),
      ...getCommonResourceActions(kindObj, resource),
    ],
    [kindObj, resource],
  );

  return [actions, !inFlight, undefined];
};

export const useCronJobActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const actions = React.useMemo(() => getCommonResourceActions(kindObj, resource), [
    kindObj,
    resource,
  ]);

  return [actions, !inFlight, undefined];
};
