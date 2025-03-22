import * as React from 'react';
import { Action } from '@console/dynamic-plugin-sdk/';
import { K8sResourceCommon, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getCommonResourceActions } from '../creators/common-factory';

export const useDefaultActionsProvider = (
  resource: K8sResourceCommon,
): [Action[], boolean, Error] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));

  const actions = React.useMemo(() => [...getCommonResourceActions(kindObj, resource)], [
    kindObj,
    resource,
  ]);

  return [actions, !inFlight, undefined];
};
