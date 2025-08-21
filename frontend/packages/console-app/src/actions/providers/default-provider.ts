import { useMemo } from 'react';
import { Action } from '@console/dynamic-plugin-sdk/';
import { K8sResourceCommon, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useDefaultActionsProvider = (
  resource: K8sResourceCommon,
): [Action[], boolean, Error] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = useMemo(() => [...commonActions], [commonActions]);

  return [actions, !inFlight, (undefined as unknown) as Error];
};
