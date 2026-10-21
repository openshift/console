import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useBuildsActions } from '../hooks/useBuildsActions';

export const useBuildActionsProvider = (resource: K8sResourceKind) => {
  const buildActions = useBuildsActions(resource);

  const actions = buildActions;

  return [actions, true];
};
