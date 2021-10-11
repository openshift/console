import { useMemo } from 'react';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const useKafkaConnectionActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = useMemo(() => {
    return getCommonResourceActions(kindObj, resource);
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};
