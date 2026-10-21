import i18next from 'i18next';
import * as _ from 'lodash';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import type { ResourceActionFactory } from './types';

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

export const HealthChecksActionFactory: ResourceActionFactory = {
  AddHealthChecks: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'add-health-checks',
    label: i18next.t('console-app~Add Health Checks'),
    cta: { href: healthChecksUrl(kind, obj) },
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata?.name,
      namespace: obj.metadata?.namespace,
      verb: 'update',
    },
  }),
  EditHealthChecks: (kind: K8sKind, obj: K8sResourceKind): Action => ({
    id: 'edit-health-checks',
    label: i18next.t('console-app~Edit Health Checks'),
    cta: { href: healthChecksUrl(kind, obj) },
    insertBefore: 'edit-labels',
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata?.name,
      namespace: obj.metadata?.namespace,
      verb: 'update',
    },
  }),
};

export const getHealthChecksAction = (kind: K8sKind, obj: K8sResourceKind): Action => {
  const hasHealthChecks = healthChecksAdded(obj);
  return hasHealthChecks
    ? HealthChecksActionFactory.EditHealthChecks(kind, obj)
    : HealthChecksActionFactory.AddHealthChecks(kind, obj);
};
