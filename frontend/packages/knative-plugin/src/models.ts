import { K8sKind } from '@console/internal/module/k8s';
import { BadgeType } from '@console/shared/src/components/badges/badge-factory';

const apiVersion = `v1beta1`;

export const ConfigurationModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion,
  kind: 'Configuration',
  plural: 'configurations',
  label: 'Configuration',
  labelPlural: 'Configurations',
  id: 'configuration',
  abbr: 'C',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
};

export const KnativeServingModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'KnativeServing',
  label: 'Knative Serving',
  labelPlural: 'Knative Servings',
  plural: 'knativeservings',
  id: 'knativeserving',
  abbr: 'KS',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
};

export const RevisionModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion,
  kind: 'Revision',
  label: 'Revision',
  labelPlural: 'Revisions',
  plural: 'revisions',
  id: 'revision',
  abbr: 'R',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
};

export const RouteModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion,
  kind: 'Route',
  label: 'Route',
  labelPlural: 'Routes',
  plural: 'routes',
  id: 'route',
  abbr: 'R',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
};

export const ServiceModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion,
  kind: 'Service',
  label: 'Service',
  labelPlural: 'Services',
  plural: 'services',
  id: 'service',
  abbr: 'S',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
};

export const EventSourceCronJobModel: K8sKind = {
  apiGroup: 'sources.eventing.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'CronJobSource',
  label: 'CronJob Source',
  labelPlural: 'CronJob Sources',
  plural: 'cronjobsources',
  id: 'cronjobsource',
  abbr: 'CJS',
  namespaced: true,
  crd: true,
};

export const EventSourceContainerModel: K8sKind = {
  apiGroup: 'sources.eventing.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'ContainerSource',
  label: 'Container Source',
  labelPlural: 'Container Sources',
  plural: 'containersources',
  id: 'containersource',
  abbr: 'CS',
  namespaced: true,
  crd: true,
};

export const EventSourceApiServerModel: K8sKind = {
  apiGroup: 'sources.eventing.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'ApiServerSource',
  label: 'ApiServerSource',
  labelPlural: 'ApiServerSources',
  plural: 'ApiServerSources',
  id: 'apiserversource',
  abbr: 'ASS',
  namespaced: true,
  crd: true,
};

export const EventSourceCamelModel: K8sKind = {
  apiGroup: 'sources.eventing.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'CamelSource',
  label: 'CamelSource',
  labelPlural: 'CamelSources',
  plural: 'camelsources',
  id: 'camelsource',
  abbr: 'CS',
  namespaced: true,
  crd: true,
};

export const EventSourceKafkaModel: K8sKind = {
  apiGroup: 'sources.eventing.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'KafkaSource',
  label: 'KafkaSource',
  labelPlural: 'KafkaSources',
  plural: 'KafkaSources',
  id: 'kafkasource',
  abbr: 'KS',
  namespaced: true,
  crd: true,
};
