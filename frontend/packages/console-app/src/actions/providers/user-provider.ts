import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action } from '@console/dynamic-plugin-sdk/src';
import * as UIActions from '@console/internal/actions/ui';
import { asAccessReview } from '@console/internal/components/utils';
import { UserModel } from '@console/internal/models';
import { referenceFor, UserKind } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

const useImpersonateAction = (resource: UserKind): Action[] => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const factory = useMemo(
    () => ({
      ImpersonateUser: () => ({
        id: 'impersonate-user',
        label: t('public~Impersonate User {{name}}', resource.metadata),
        cta: () => {
          dispatch(UIActions.startImpersonate('User', resource.metadata.name));
          navigate(window.SERVER_FLAGS.basePath);
        },
        accessReview: asAccessReview(UserModel, resource, 'impersonate'),
      }),
    }),
    [dispatch, navigate, resource, t],
  );

  const action = useMemo<Action[]>(() => [factory.ImpersonateUser()], [factory]);
  return action;
};

export const useUserActionsProvider = (resource: UserKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const impersonateAction = useImpersonateAction(resource);
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = useMemo(() => [...impersonateAction, ...commonActions], [
    commonActions,
    impersonateAction,
  ]);

  return [actions, !inFlight, false];
};
