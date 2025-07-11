import * as React from 'react';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { getHealthChecksAction } from '../creators/health-checks-factory';
import { usePDBActions } from '../creators/pdb-factory';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useStatefulSetActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [pdbActions] = usePDBActions(kindObj, resource);
  const [commonActions, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.ModifyCount,
    CommonActionCreator.AddStorage,
  ] as const);
  const commonResourceActions = useCommonResourceActions(kindObj, resource);

  const actions = React.useMemo(
    () =>
      !isReady
        ? []
        : [
            commonActions.ModifyCount,
            ...pdbActions,
            getHealthChecksAction(kindObj, resource),
            commonActions.AddStorage,
            ...commonResourceActions,
          ],
    [kindObj, resource, pdbActions, commonActions, commonResourceActions, isReady],
  );

  return [actions, !inFlight, undefined];
};
