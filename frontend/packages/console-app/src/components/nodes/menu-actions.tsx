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
import { LazyConfigureUnschedulableModalOverlay } from './modals';
import { markNodesSchedulable } from './nodeSchedulingActions';

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
  const { t } = useTranslation('console-app');
  const launchModal = useOverlay();
  const deleteMessage = useMemo(
    () => (
      <p>
        {t(
          'You cannot undo this action. Deleting a node signals to Kubernetes that the node is unrecoverable, which deletes all pods scheduled to it. If you delete a node that is still running but unresponsive, stateful workloads and persistent volumes might suffer data loss or corruption. Only delete a node after you confirm that it has completely stopped and you cannot restore it.',
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
        label: t('Mark as schedulable'),
        cta: () => markNodesSchedulable(obj),
        accessReview: asAccessReview(kindObj, obj, 'patch'),
      });
    } else {
      actions.push({
        id: 'mark-as-unschedulable',
        label: t('Mark as unschedulable'),
        cta: () => launchModal(LazyConfigureUnschedulableModalOverlay, { resource: obj }),
        accessReview: asAccessReview(kindObj, obj, 'patch'),
      });
    }

    actions.push(...commonActions);
    return actions;
  }, [kindObj, obj, t, commonActions, launchModal]);

  return [nodeActions, !inFlight, undefined];
};
