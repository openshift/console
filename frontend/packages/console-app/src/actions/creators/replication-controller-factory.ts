import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { rollbackModal, confirmModal } from '@console/internal/components/modals';
import { asAccessReview } from '@console/internal/components/utils';
import { DeploymentConfigModel } from '@console/internal/models';
import { ReplicationControllerKind, K8sKind, k8sPatch } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { ResourceActionFactory } from './common-factory';

const INACTIVE_STATUSES = ['New', 'Pending', 'Running'];

export const ReplicationControllerFactory: ResourceActionFactory = {
  RollbackDeploymentConfigAction: (kind: K8sKind, obj: ReplicationControllerKind): Action => ({
    id: 'rollback-deployment-config',
    label: i18next.t('console-app~Rollback'),
    disabled: INACTIVE_STATUSES.includes(
      obj?.metadata?.annotations?.['openshift.io/deployment.phase'],
    ),
    cta: () =>
      rollbackModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: {
      group: DeploymentConfigModel.apiGroup,
      resource: DeploymentConfigModel.plural,
      name: getOwnerNameByKind(obj, DeploymentConfigModel),
      namespace: obj?.metadata?.namespace,
      verb: 'update',
    },
  }),
  CancelRollout: (kind: K8sKind, obj: ReplicationControllerKind): Action => ({
    id: 'cancel-rollout',
    label: i18next.t('console-app~Cancel rollout'),
    cta: () =>
      confirmModal({
        title: i18next.t('console-app~Cancel rollout'),
        message: i18next.t('console-app~Are you sure you want to cancel this rollout?'),
        btnText: i18next.t('console-app~Yes, cancel'),
        cancelText: i18next.t("console-app~No, don't cancel"),
        executeFn: () =>
          k8sPatch(kind, obj, [
            {
              op: 'add',
              path: '/metadata/annotations/openshift.io~1deployment.cancelled',
              value: 'true',
            },
            {
              op: 'add',
              path: '/metadata/annotations/openshift.io~1deployment.status-reason',
              value: 'cancelled by the user',
            },
          ]),
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
};
