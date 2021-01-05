import * as React from 'react';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { history, resourceListPathFromModel } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { Trans, useTranslation } from 'react-i18next';
import { GLOBAL_OPERATOR_NAMESPACE, OPERATOR_UNINSTALL_MESSAGE_ANNOTATION } from '../../const';

export const UninstallOperatorModal: React.FC<UninstallOperatorModalProps> = ({
  cancel,
  close,
  csv,
  k8sKill,
  subscription,
}) => {
  const { t } = useTranslation();
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const submit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const deleteOptions = {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      };
      handlePromise(
        Promise.all([
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
        ]),
      )
        .then(() => {
          close();
          if (
            window.location.pathname.split('/').includes(subscription.metadata.name) ||
            window.location.pathname.split('/').includes(subscription.status.installedCSV)
          ) {
            history.push(
              resourceListPathFromModel(ClusterServiceVersionModel, getActiveNamespace()),
            );
          }
        })
        .catch(() => {});
    },
    [close, handlePromise, k8sKill, subscription],
  );

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
        <Trans t={t} ns="olm">
          This will remove Operator <strong>{{ name }}</strong> from{' '}
          <strong>{{ namespace }}</strong>. Removing the Operator will not remove any of its custom
          resource definitions or managed resources. If your Operator has deployed applications on
          the cluster or configured off-cluster resources, these will continue to run and need to be
          cleaned up manually.
        </Trans>
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
