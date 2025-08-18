import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useBuildsActions } from '../hooks/useBuildsActions';

export const useBuildActionsProvider = (resource: K8sResourceKind) => {
  const buildActions = useBuildsActions(resource);

  const actions = React.useMemo(() => [...buildActions], [buildActions]);

  return [actions, true];
};
