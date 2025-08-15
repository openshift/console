import * as React from 'react';
import { ClusterRoleBindingKind, RoleBindingKind } from '@console/internal/module/k8s';
import { useBindingActions } from '../hooks/useBindingActions';

export const useBindingActionsProvider = (resource: RoleBindingKind | ClusterRoleBindingKind) => {
  const bindingActions = useBindingActions(resource);

  const actions = React.useMemo(() => [...bindingActions], [bindingActions]);

  return [actions, true];
};
