import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { DeploymentActionFactory } from '../creators/deployment-factory';

export const useCreateServiceBindingProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const deploymentActions = React.useMemo(
    () => DeploymentActionFactory.CreateServiceBinding(kindObj, resource),
    [kindObj, resource],
  );

  return [deploymentActions, !inFlight, undefined];
};
