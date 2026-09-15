import { useMemo } from 'react';
import type { ClusterRoleBindingKind, RoleBindingKind } from '@console/internal/module/k8s';
import { useBindingActions } from '../hooks/useBindingActions';

export const useBindingActionsProvider = (resource: RoleBindingKind | ClusterRoleBindingKind) => {
  // On the detail page, the raw K8s resource does not have subjectIndex set (it is
  // only added by the list-page flatten function which creates one row per subject).
  // Default to the first subject so that impersonate and other subject-specific
  // actions are available from the detail page Actions dropdown.
  const resourceWithSubjectIndex = useMemo(
    () =>
      resource && typeof resource.subjectIndex !== 'number'
        ? { ...resource, subjectIndex: 0 }
        : resource,
    [resource],
  );
  const bindingActions = useBindingActions(resourceWithSubjectIndex);

  const actions = useMemo(() => [...bindingActions], [bindingActions]);

  return [actions, true];
};
