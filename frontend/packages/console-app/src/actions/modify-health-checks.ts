import * as _ from 'lodash';
import { K8sKind, K8sResourceKind, ContainerSpec } from '@console/internal/module/k8s/types';
import { KebabOption } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin';

export const healthCheckAdded = (containers: ContainerSpec[]): boolean => {
  return _.every(
    containers,
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );
};

export const ModifyHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  const containers = obj?.spec?.template?.spec?.containers;
  return {
    label: healthCheckAdded(containers) ? 'Edit Health Checks' : 'Add Health Checks',
    href: `/k8s/ns/${obj.metadata.namespace}/${
      model.kind === KnativeServiceModel.kind ? referenceForModel(KnativeServiceModel) : model.kind
    }/${obj.metadata.name}/containers/${
      obj?.spec?.template?.spec?.containers?.[0]?.name
    }/health-checks`,
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};
