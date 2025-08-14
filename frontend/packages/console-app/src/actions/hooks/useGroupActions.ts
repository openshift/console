import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action, K8sVerb } from '@console/dynamic-plugin-sdk';
import * as UIActions from '@console/internal/actions/ui';
import { addUsersModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { GroupModel } from '@console/internal/models';
import { GroupKind, K8sKind } from '@console/internal/module/k8s';

/**
 * Actions specific to Group resources.
 * Includes impersonation and add-users.
 */
export const useGroupActions = (obj: GroupKind): Action[] => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const startImpersonate = React.useCallback(
    (kind: string, name: string) => dispatch(UIActions.startImpersonate(kind, name)),
    [dispatch],
  );

  const factory = React.useMemo(
    () => ({
      impersonate: (): Action => ({
        id: 'impersonate-group',
        label: t('public~Impersonate Group {{name}}', obj.metadata),
        cta: () => {
          startImpersonate('Group', obj.metadata.name);
          navigate(window.SERVER_FLAGS.basePath);
        },
        // Must use API group authorization.k8s.io, NOT user.openshift.io
        // See https://kubernetes.io/docs/reference/access-authn-authz/authentication/#user-impersonation
        accessReview: {
          group: 'authorization.k8s.io',
          resource: 'groups',
          name: obj.metadata.name,
          verb: 'impersonate' as K8sVerb,
        },
      }),
      addUsers: (): Action => ({
        id: 'add-users',
        label: t('public~Add Users'),
        cta: () =>
          addUsersModal({
            group: obj,
          }),
        accessReview: asAccessReview((GroupModel as unknown) as K8sKind, obj, 'patch'),
      }),
    }),
    [navigate, obj, startImpersonate, t],
  );

  return React.useMemo<Action[]>(() => [factory.impersonate(), factory.addUsers()], [factory]);
};
