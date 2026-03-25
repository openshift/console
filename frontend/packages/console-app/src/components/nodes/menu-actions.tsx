import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommonResourceActions } from '@console/app/src/actions//hooks/useCommonResourceActions';
import type { Action } from '@console/dynamic-plugin-sdk';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { CertificateSigningRequestModel } from '@console/internal/models';
import type {
  CertificateSigningRequestKind,
  ExtensionHook,
  NodeKind,
} from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { isNodeUnschedulable } from '@console/shared/src/selectors/node';
import { makeNodeSchedulable } from '../../k8s/requests/nodes';
import { LazyConfigureUnschedulableModalOverlay } from './modals';

const updateCSR = (csr: CertificateSigningRequestKind, type: 'Approved' | 'Denied') => {
  const approvedCSR = {
    ...csr,
    status: {
      ...(csr.status || {}),
      conditions: [
        {
          lastUpdateTime: new Date().toISOString(),
          message: `This CSR was ${type.toLowerCase()} via OpenShift Console`,
          reason: 'OpenShiftConsoleCSRApprove',
          status: 'True',
          type,
        },
        ...(csr.status?.conditions || []),
      ],
    },
  };
  return k8sUpdateResource<CertificateSigningRequestKind>({
    data: approvedCSR,
    model: CertificateSigningRequestModel,
    path: 'approval',
  });
};

export const approveCSR = (csr: CertificateSigningRequestKind) => updateCSR(csr, 'Approved');

export const denyCSR = (csr: CertificateSigningRequestKind) => updateCSR(csr, 'Denied');

export const useNodeActions: ExtensionHook<Action[], NodeKind> = (obj) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(obj));
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const deleteMessage = useMemo(
    () => (
      <p>
        {t(
          'console-app~This action cannot be undone. Deleting a node will instruct Kubernetes that the node is down or unrecoverable and delete all pods scheduled to that node. If the node is still running but unresponsive and the node is deleted, stateful workloads and persistent volumes may suffer corruption or data loss. Only delete a node that you have confirmed is completely stopped and cannot be restored.',
        )}
      </p>
    ),
    [t],
  );
  const commonActions = useCommonResourceActions(kindObj, obj, deleteMessage);
  const nodeActions = useMemo<Action[]>(() => {
    const actions: Action[] = [];
    if (isNodeUnschedulable(obj)) {
      actions.push({
        id: 'mark-as-schedulable',
        label: t('console-app~Mark as schedulable'),
        cta: () => makeNodeSchedulable(obj),
        accessReview: asAccessReview(kindObj, obj, 'patch'),
      });
    } else {
      actions.push({
        id: 'mark-as-unschedulable',
        label: t('console-app~Mark as unschedulable'),
        cta: () => launchModal(LazyConfigureUnschedulableModalOverlay, { resource: obj }),
        accessReview: asAccessReview(kindObj, obj, 'patch'),
      });
    }

    actions.push(...commonActions);
    return actions;
  }, [kindObj, obj, t, commonActions, launchModal]);

  return [nodeActions, !inFlight, undefined];
};
