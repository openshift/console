import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { configureUpdateStrategyModal, errorModal } from '@console/internal/components/modals';
import { togglePaused, asAccessReview } from '@console/internal/components/utils';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { resourceLimitsModal } from '../../components/modals/resource-limits';
import { ResourceActionFactory } from './common-factory';

export const DeploymentActionFactory: ResourceActionFactory = {
  EditDeployment: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: `edit-deployment`,
    label: i18next.t('console-app~Edit {{kind}}', { kind: kind.kind }),
    cta: {
      href: `/edit-deployment/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${kind.kind}`,
    },
    // TODO: Fallback to "View YAML"? We might want a similar fallback for annotations, labels, etc.
    accessReview: asAccessReview(kind, obj, 'update'),
  }),
  UpdateStrategy: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-update-strategy',
    label: i18next.t('console-app~Edit update strategy'),
    cta: () => configureUpdateStrategyModal({ deployment: obj }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  }),
  PauseAction: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'pause-rollout',
    label: obj.spec.paused
      ? i18next.t('console-app~Resume rollouts')
      : i18next.t('console-app~Pause rollouts'),
    cta: () => togglePaused(kind, obj).catch((err) => errorModal({ error: err.message })),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  }),
  EditResourceLimits: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-resource-limits',
    label: i18next.t('console-app~Edit resource limits'),
    cta: () =>
      resourceLimitsModal({
        model: kind,
        resource: obj,
      }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  }),
};
