import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { rollbackModal } from '@console/internal/components/modals';
import { DeploymentModel } from '@console/internal/models';
import { ReplicaSetKind, K8sKind } from '@console/internal/module/k8s';
import { getOwnerNameByKind } from '@console/shared/src';
import { ResourceActionFactory } from './common-factory';

export const ReplicaSetFactory: ResourceActionFactory = {
  RollbackDeploymentAction: (kind: K8sKind, obj: ReplicaSetKind): Action => ({
    id: 'rollback-deployment',
    label: i18next.t('console-app~Rollback'),
    cta: () =>
      rollbackModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      name: getOwnerNameByKind(obj, DeploymentModel),
      namespace: obj?.metadata?.namespace,
      verb: 'patch',
    },
  }),
};
