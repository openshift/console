import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useActiveCluster } from '@console/shared/src';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';

export const usePodActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [cluster] = useActiveCluster();

  const actions = React.useMemo(
    () => [...getCommonResourceActions(kindObj, resource, undefined, cluster)],
    [cluster, kindObj, resource],
  );

  return [actions, !inFlight, undefined];
};
