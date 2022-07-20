import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { configureUpdateStrategyModal, errorModal } from '@console/internal/components/modals';
import { togglePaused, asAccessReview } from '@console/internal/components/utils';
import { DeploymentConfigModel } from '@console/internal/models';
import { K8sResourceKind, K8sKind, k8sCreate } from '@console/internal/module/k8s';
import { ServiceBindingModel } from '@console/service-binding-plugin/src/models';
import { resourceLimitsModal } from '../../components/modals/resource-limits';
import { serviceBindingModal } from '../../components/modals/service-binding';
import { ResourceActionFactory } from './common-factory';

const deploymentConfigRollout = (dc: K8sResourceKind): Promise<K8sResourceKind> => {
  const req = {
    kind: 'DeploymentRequest',
    apiVersion: 'apps.openshift.io/v1',
    name: dc.metadata.name,
    latest: true,
    force: true,
  };
  const opts = {
    name: dc.metadata.name,
    ns: dc.metadata.namespace,
    path: 'instantiate',
  };
  return k8sCreate(DeploymentConfigModel, req, opts);
};

const restartRollout = (model: K8sKind, obj: K8sResourceKind) => {
  const patch = [];
  if (!('annotations' in obj.spec.template.metadata)) {
    patch.push({
      path: '/spec/template/metadata/annotations',
      op: 'add',
      value: {},
    });
  }
  patch.push({
    path: '/spec/template/metadata/annotations/openshift.openshift.io~1restartedAt',
    op: 'add',
    value: new Date(),
  });

  return k8sPatchResource({
    model,
    resource: obj,
    data: patch,
  });
};

export const retryRollout = (model: K8sKind, obj: K8sResourceKind) => {
  const patch = [
    {
      path: '/metadata/annotations/openshift.io~1deployment.phase',
      op: 'replace',
      value: 'New',
    },
    {
      path: '/metadata/annotations/openshift.io~1deployment.cancelled',
      op: 'add',
      value: '',
    },
    {
      path: '/metadata/annotations/openshift.io~1deployment.cancelled',
      op: 'remove',
    },
    {
      path: '/metadata/annotations/openshift.io~1deployment.status-reason',
      op: 'remove',
    },
  ];
  return k8sPatchResource({
    model,
    resource: obj,
    data: patch,
  });
};

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
  PauseRollout: (kind: K8sKind, obj: K8sResourceKind): Action => ({
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
  RestartRollout: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'restart-rollout',
    label: i18next.t('console-app~Restart rollout'),
    cta: () => restartRollout(kind, obj).catch((err) => errorModal({ error: err.message })),
    disabled: obj.spec.paused || false,
    disabledTooltip: 'The deployment is paused and cannot be restarted.',
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  }),
  StartDCRollout: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'start-rollout',
    label: i18next.t('console-app~Start rollout'),
    cta: () =>
      deploymentConfigRollout(obj).catch((err) => {
        const error = err.message;
        errorModal({ error });
      }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      subresource: 'instantiate',
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'create',
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
  CreateServiceBinding: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'create-service-binding',
    label: i18next.t('console-app~Create Service Binding'),
    cta: () =>
      serviceBindingModal({
        model: kind,
        source: obj,
      }),
    accessReview: asAccessReview(ServiceBindingModel, obj, 'create'),
  }),
};
