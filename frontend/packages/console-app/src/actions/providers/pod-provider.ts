import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';
import { usePDBActions } from '../creators/pdb-factory';

export const usePodActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);

  const actions = React.useMemo(
    () => [...pdbActions, ...getCommonResourceActions(kindObj, resource)],
    [kindObj, pdbActions, resource],
  );

  return [actions, !inFlight, undefined];
};
