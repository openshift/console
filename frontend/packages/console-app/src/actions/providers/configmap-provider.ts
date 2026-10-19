import { useMemo } from 'react';
import type { ConfigMapKind } from '@openshift/api-types/dist/kubernetes/latest';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useConfigMapActionsProvider = (resource: ConfigMapKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const editPath = useMemo(
    () => (kindObj ? `${resourceObjPath(resource, kindObj.kind)}/form` : undefined),
    [kindObj, resource],
  );

  const commonActions = useCommonResourceActions(kindObj, resource, undefined, editPath);

  return [commonActions, !inFlight];
};
