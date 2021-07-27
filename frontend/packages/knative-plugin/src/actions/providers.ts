import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { hideKnatifyAction, MakeServerless } from './knatify';

export const useKnativeDeploymentActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const deploymentActions = React.useMemo(() => {
    return hideKnatifyAction(resource) ? [] : MakeServerless(kindObj, resource);
  }, [kindObj, resource]);

  return [deploymentActions, !inFlight, undefined];
};
