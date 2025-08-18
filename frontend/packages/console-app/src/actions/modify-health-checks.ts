import * as _ from 'lodash';
import { KebabOption } from '@console/internal/components/utils';
import { K8sKind, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';

const healthChecksAdded = (resource: K8sResourceKind): boolean => {
  const containers = resource?.spec?.template?.spec?.containers;
  return _.every(
    containers,
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );
};

const healthChecksUrl = (model: K8sKind, obj: K8sResourceKind): string => {
  const { kind, metadata: { name = '', namespace = '' } = {} } = obj;
  const resourceKind = model.crd ? referenceFor(obj) : kind;
  const containers = obj?.spec?.template?.spec?.containers;
  const containerName = containers?.[0]?.name;
  return `/k8s/ns/${namespace}/${resourceKind}/${name}/containers/${containerName}/health-checks`;
};

/** @deprecated - Moving to Extensible Action for Deployment resource, see @console/app/src/actions */
export const AddHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    // t('console-app~Add Health Checks')
    labelKey: 'console-app~Add Health Checks',
    hidden: healthChecksAdded(obj),
    href: healthChecksUrl(model, obj),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata?.name,
      namespace: obj.metadata?.namespace,
      verb: 'update',
    },
  };
};

/** @deprecated - Moving to Extensible Action for Deployment resource, see @console/app/src/actions */
export const EditHealthChecks = (model: K8sKind, obj: K8sResourceKind): KebabOption => {
  return {
    // t('console-app~Edit Health Checks')
    labelKey: 'console-app~Edit Health Checks',
    hidden: !healthChecksAdded(obj),
    href: healthChecksUrl(model, obj),
    accessReview: {
      group: model.apiGroup,
      resource: model.plural,
      name: obj.metadata?.name,
      namespace: obj.metadata?.namespace,
      verb: 'get',
    },
  };
};
