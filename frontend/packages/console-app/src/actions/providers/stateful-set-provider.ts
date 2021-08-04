import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionFactory, getCommonResourceActions } from '../creators/common-factory';
import { getHealthChecksAction } from '../creators/health-checks-factory';

export const useStatefulSetActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const actions = React.useMemo(
    () => [
      CommonActionFactory.ModifyCount(kindObj, resource),
      getHealthChecksAction(kindObj, resource),
      CommonActionFactory.AddStorage(kindObj, resource),
      ...getCommonResourceActions(kindObj, resource),
    ],
    [kindObj, resource],
  );

  return [actions, !inFlight, undefined];
};
