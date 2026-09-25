import { useMemo } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { Action } from '@console/dynamic-plugin-sdk/src/extensions/actions';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import * as UIActions from '@console/internal/actions/ui';
import { asAccessReview } from '@console/internal/components/utils';
import { downloadKubeconfig } from '@console/internal/components/utils/download-kubeconfig';
import { ServiceAccountModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s';
import { useToast } from '@console/shared/src/components/toast/useToast';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

const serviceAccountUsername = (namespace: string | undefined, name: string | undefined) =>
  `system:serviceaccount:${namespace}:${name}`;

const useImpersonateAction = (resource: K8sResourceKind): Action[] => {
  const { t } = useTranslation('console-app');
  const navigate = useNavigate();
  const dispatch = useConsoleDispatch();

  const factory = useMemo(
    () => ({
      ImpersonateServiceAccount: () => ({
        id: 'impersonate-service-account',
        label: t('Impersonate service account {{name}}', { name: resource?.metadata?.name }),
        cta: () => {
          dispatch(
            UIActions.startImpersonate(
              'ServiceAccount',
              serviceAccountUsername(resource?.metadata?.namespace, resource?.metadata?.name),
            ),
          );
          navigate(window.SERVER_FLAGS.basePath);
        },
        accessReview: asAccessReview(ServiceAccountModel, resource, 'impersonate'),
      }),
    }),
    [dispatch, navigate, resource, t],
  );

  return useMemo<Action[]>(
    () =>
      resource?.metadata?.namespace && resource?.metadata?.name
        ? [factory.ImpersonateServiceAccount()]
        : [],
    [factory, resource?.metadata?.name, resource?.metadata?.namespace],
  );
};

const useDownloadKubeconfigAction = (resource: K8sResourceKind): Action[] => {
  const { t } = useTranslation('console-app');
  const toast = useToast();

  const factory = useMemo(
    () => ({
      DownloadKubeconfig: () => ({
        id: 'download-kubeconfig-service-account',
        label: t('Download kubeconfig'),
        cta: () => {
          downloadKubeconfig(
            'ServiceAccount',
            resource?.metadata?.name,
            resource?.metadata?.namespace,
          ).catch((e) => {
            toast.addToast({
              variant: AlertVariant.danger,
              title: t('Failed to download kubeconfig'),
              content: e.message,
            });
          });
        },
        // A bound token is minted via the serviceaccounts/token subresource, so
        // gate the action on create access to that subresource.
        accessReview: asAccessReview(ServiceAccountModel, resource, 'create', 'token'),
      }),
    }),
    [resource, t, toast],
  );

  return useMemo<Action[]>(
    () =>
      resource?.metadata?.namespace && resource?.metadata?.name
        ? [factory.DownloadKubeconfig()]
        : [],
    [factory, resource?.metadata?.name, resource?.metadata?.namespace],
  );
};

export const useServiceAccountActionsProvider: ExtensionHook<Action[], K8sResourceKind> = (
  resource,
) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const impersonateAction = useImpersonateAction(resource);
  const downloadKubeconfigAction = useDownloadKubeconfigAction(resource);
  const commonActions = useCommonResourceActions(kindObj, resource);

  const actions = useMemo(
    () => [...impersonateAction, ...downloadKubeconfigAction, ...commonActions],
    [commonActions, downloadKubeconfigAction, impersonateAction],
  );

  return [actions, !inFlight, false];
};
