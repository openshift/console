import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useCommonResourceActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = React.useMemo(() => [...commonActions], [commonActions]);

  return [actions, !inFlight, undefined];
};
