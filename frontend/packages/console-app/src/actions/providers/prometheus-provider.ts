import { useMemo } from 'react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

export const usePrometheusActionsProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const [commonActions] = useCommonActions<CommonActionCreator[]>(kindObj, resource, [
    CommonActionCreator.ModifyLabels,
    CommonActionCreator.ModifyCount,
    CommonActionCreator.ModifyAnnotations,
    CommonActionCreator.Edit,
    CommonActionCreator.Delete,
  ]);

  const actions = useMemo(() => Object.values(commonActions), [commonActions]);

  return [actions, !inFlight];
};
