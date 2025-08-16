import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action, K8sVerb } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import * as UIActions from '@console/internal/actions/ui';
import { asAccessReview } from '@console/internal/components/utils';
import { GroupModel } from '@console/internal/models';
import { GroupKind, K8sKind } from '@console/internal/module/k8s';
import AddGroupUsersModal from '../../components/modals/add-group-users-modal';

/**
 * Actions specific to Group resources.
 */
export const useGroupActions = (obj: GroupKind): Action[] => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const launchOverlay = useOverlay();

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
        cta: () => launchOverlay(AddGroupUsersModal, { group: obj }),
        accessReview: asAccessReview((GroupModel as unknown) as K8sKind, obj, 'patch'),
      }),
    }),
    [navigate, obj, startImpersonate, t, launchOverlay],
  );

  return React.useMemo<Action[]>(() => [factory.impersonate(), factory.addUsers()], [factory]);
};
