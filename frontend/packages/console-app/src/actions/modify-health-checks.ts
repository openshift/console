import * as _ from 'lodash';
import { K8sKind, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { KebabOption } from '@console/internal/components/utils';

const healthChecksAdded = (resource: K8sResourceKind): boolean => {
  const containers = resource?.spec?.template?.spec?.containers;
  return _.every(
    containers,
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );
};

const healthChecksUrl = (model: K8sKind, obj: K8sResourceKind): string => {
  const {
    kind,
    metadata: { name, namespace },
  } = obj;
  const resourceKind = model.crd ? referenceFor(obj) : kind;
  const containers = obj?.spec?.template?.spec?.containers;
  const containerName = containers?.[0]?.name;
  return `/k8s/ns/${namespace}/${resourceKind}/${name}/containers/${containerName}/health-checks`;
};

export const AddHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'Add Health Checks',
    hidden: healthChecksAdded(obj),
    href: healthChecksUrl(model, obj),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};

export const EditHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    label: 'Edit Health Checks',
    hidden: !healthChecksAdded(obj),
    href: healthChecksUrl(model, obj),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  };
};

export const ViewHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  const accessReview = {
    group: model.apiGroup,
    resource: model.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
  };
  return {
    label: 'View Health Checks',
    hidden: false,
    href: healthChecksUrl(model, obj),
    accessReview: { ...accessReview, verb: 'get' },
  };
};
