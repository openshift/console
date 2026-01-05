import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action, useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { CommonActionCreator } from '../hooks/types';
import { useCommonActions } from '../hooks/useCommonActions';

const roleKind = (role: K8sResourceKind) => (role.metadata.namespace ? 'Role' : 'ClusterRole');

const useAddRoleBindingAction = (role: K8sResourceKind): Action[] => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const factory = useMemo(
    () => ({
      AddRoleBinding: () => ({
        id: 'add-role-binding',
        label: t('public~Add RoleBinding'),
        cta: () =>
          navigate(
            `/k8s/${
              role.metadata.namespace
                ? `ns/${role.metadata.namespace}/rolebindings/~new?rolekind=${roleKind(
                    role,
                  )}&rolename=${role.metadata.name}&namespace=${role.metadata.namespace}`
                : `cluster/rolebindings/~new?rolekind=${roleKind(role)}&rolename=${
                    role.metadata.name
                  }`
            }`,
          ),
      }),
    }),
    [role, t, navigate],
  );

  const action = useMemo<Action[]>(() => [factory.AddRoleBinding()], [factory]);

  return action;
};

export const useRoleActionsProvider = (resource: K8sResourceKind): [Action[], boolean, boolean] => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const addRoleBindingAction = useAddRoleBindingAction(resource);
  const [actions, isReady] = useCommonActions(kindObj, resource, [
    CommonActionCreator.Edit,
    CommonActionCreator.Delete,
  ] as const);
  const commonActions = useMemo(() => (isReady ? Object.values(actions) : []), [actions, isReady]);
  const RoleActions = useMemo(() => [...addRoleBindingAction, ...commonActions], [
    addRoleBindingAction,
    commonActions,
  ]);

  return [RoleActions, !inFlight, false];
};
