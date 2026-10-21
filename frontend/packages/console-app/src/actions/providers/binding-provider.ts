import { useMemo } from 'react';
import type { ClusterRoleBindingKind, RoleBindingKind } from '@console/internal/module/k8s';
import { useBindingActions } from '../hooks/useBindingActions';

export const useBindingActionsProvider = (resource: RoleBindingKind | ClusterRoleBindingKind) => {
  const bindingActions = useBindingActions(resource);

  const actions = useMemo(() => [...bindingActions], [bindingActions]);

  return [actions, true];
};
