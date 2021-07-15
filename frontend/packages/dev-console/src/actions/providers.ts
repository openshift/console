import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { EditImportApplication } from './creators';

export const useImportDeploymentActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const deploymentActions = React.useMemo(() => {
    const annotation = resource?.metadata?.annotations?.['openshift.io/generated-by'];
    const isFromDevfile = resource?.metadata?.annotations?.isFromDevfile;
    const showEditImportAction = annotation === 'OpenShiftWebConsole' || !isFromDevfile;

    return showEditImportAction ? EditImportApplication(kindObj, resource) : [];
  }, [kindObj, resource]);

  return [deploymentActions, !inFlight, undefined];
};
