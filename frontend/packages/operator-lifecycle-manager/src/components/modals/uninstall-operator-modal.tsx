import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { getActiveNamespace } from '@console/internal/actions/ui';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { history, resourceListPathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import {
  K8sKind,
  K8sResourceKind,
  k8sPatch,
  referenceForModel,
} from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { getPluginPatch, isPluginEnabled } from '@console/shared/src/utils';
import { GLOBAL_OPERATOR_NAMESPACE, OPERATOR_UNINSTALL_MESSAGE_ANNOTATION } from '../../const';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { getClusterServiceVersionPlugins } from '../../utils';

export const UninstallOperatorModal: React.FC<UninstallOperatorModalProps> = ({
  cancel,
  close,
  csv,
  k8sKill,
  subscription,
}) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });

  const csvPlugins = getClusterServiceVersionPlugins(csv?.metadata?.annotations);

  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>(
    canPatchConsoleOperatorConfig && csvPlugins.length > 0
      ? {
          kind: referenceForModel(ConsoleOperatorConfigModel),
          isList: false,
          name: CONSOLE_OPERATOR_CONFIG_NAME,
        }
      : null,
  );

  const enabledPlugins = csvPlugins.filter((plugin) =>
    isPluginEnabled(consoleOperatorConfig, plugin),
  );

  const removePlugins: boolean =
    !!consoleOperatorConfig && canPatchConsoleOperatorConfig && enabledPlugins.length > 0;

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const deleteOptions = {
      kind: 'DeleteOptions',
      apiVersion: 'v1',
      propagationPolicy: 'Foreground',
    };

    const patch = removePlugins
      ? enabledPlugins.map((plugin) => getPluginPatch(consoleOperatorConfig, plugin, false))
      : null;

    const allPromises = [
      k8sKill(SubscriptionModel, subscription, {}, deleteOptions),
      ...(subscription?.status?.installedCSV
        ? [
            k8sKill(
              ClusterServiceVersionModel,
              {
                metadata: {
                  name: subscription.status.installedCSV,
                  namespace: subscription.metadata.namespace,
                },
              },
              {},
              deleteOptions,
            ).catch(() => Promise.resolve()),
          ]
        : []),
      ...(removePlugins
        ? [k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, patch)]
        : []),
    ];

    handlePromise(Promise.all(allPromises))
      .then(() => {
        close();
        if (
          window.location.pathname.split('/').includes(subscription.metadata.name) ||
          window.location.pathname.split('/').includes(subscription.status.installedCSV)
        ) {
          history.push(resourceListPathFromModel(ClusterServiceVersionModel, getActiveNamespace()));
        }
      })
      .catch(() => {});
  };

  const name = csv?.spec?.displayName || subscription?.spec?.name;
  const namespace =
    subscription.metadata.namespace === GLOBAL_OPERATOR_NAMESPACE
      ? 'all-namespaces'
      : subscription.metadata.namespace;
  const uninstallMessage = csv?.metadata?.annotations?.[OPERATOR_UNINSTALL_MESSAGE_ANNOTATION];
  return (
    <form onSubmit={submit} name="form" className="modal-content co-catalog-install-modal">
      <ModalTitle className="modal-header">
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {t('olm~Uninstall Operator?')}
      </ModalTitle>
      <ModalBody>
        <p>
          <Trans t={t} ns="olm">
            Operator <strong>{{ name }}</strong> will be removed from{' '}
            <strong>{{ namespace }}</strong>, but any of its custom resource definitions or managed
            resources will remain. If your Operator deployed applications on the cluster or
            configured off-cluster resources, these will continue to run and require manual cleanup.
          </Trans>
        </p>
        {removePlugins && (
          <p>
            {t('olm~The console plugin provided by this operator will be disabled and removed.', {
              count: enabledPlugins.length,
            })}
          </p>
        )}
        {uninstallMessage && (
          <>
            <h2>{t('olm~Message from Operator developer')}</h2>
            <p>{uninstallMessage}</p>
          </>
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        cancel={cancel}
        submitDanger
        submitText={t('olm~Uninstall')}
      />
    </form>
  );
};

export const createUninstallOperatorModal = createModalLauncher(UninstallOperatorModal);

export type UninstallOperatorModalProps = {
  cancel?: () => void;
  close?: () => void;
  k8sKill: (kind: K8sKind, resource: K8sResourceKind, options: any, json: any) => Promise<any>;
  k8sGet: (kind: K8sKind, name: string, namespace: string) => Promise<K8sResourceKind>;
  k8sPatch: (
    kind: K8sKind,
    resource: K8sResourceKind,
    data: { op: string; path: string; value: any }[],
  ) => Promise<any>;
  subscription: SubscriptionKind;
  csv?: ClusterServiceVersionKind;
};

UninstallOperatorModal.displayName = 'UninstallOperatorModal';
