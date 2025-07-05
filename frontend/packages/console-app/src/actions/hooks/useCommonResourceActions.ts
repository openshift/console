import * as React from 'react';
import { Action } from '@console/dynamic-plugin-sdk';
import { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { CommonActionCreator } from './types';
import { useCommonActions } from './useCommonActions';

export const useCommonResourceActions = (
  kind: K8sModel,
  resource: K8sResourceKind,
  message?: JSX.Element,
): Action[] => {
  const actions = useCommonActions(
    kind,
    resource,
    [
      CommonActionCreator.ModifyLabels,
      CommonActionCreator.ModifyAnnotations,
      CommonActionCreator.Edit,
      CommonActionCreator.Delete,
    ] as const,
    message,
  );
  return React.useMemo(() => Object.values(actions), [actions]);
};
