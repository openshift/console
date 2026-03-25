import { useMemo } from 'react';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import type { SecretKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useSecretsActionsProvider = (resource: SecretKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const editPath = useMemo(
    () => (kindObj ? `${resourceObjPath(resource, kindObj.kind)}/edit` : undefined),
    [kindObj, resource],
  );

  const commonActions = useCommonResourceActions(kindObj, resource, undefined, editPath);

  return [commonActions, !inFlight];
};
