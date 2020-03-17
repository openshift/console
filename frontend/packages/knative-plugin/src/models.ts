import {
  chart_color_cyan_400 as knativeServingColor,
  chart_color_red_300 as knativeEventingColor,
} from '@patternfly/react-tokens';
import { K8sKind } from '@console/internal/module/k8s';
import { BadgeType } from '@console/shared/src/components/badges/badge-factory';
import {
  KNATIVE_EVENT_SOURCE_APIGROUP,
  KNATIVE_EVENT_SOURCE_APIGROUP_DEP,
  KNATIVE_SERVING_APIGROUP,
} from './const';

const apiVersion = 'v1';

export const ConfigurationModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Configuration',
  plural: 'configurations',
  label: 'Configuration',
  labelPlural: 'Configurations',
  id: 'configuration',
  abbr: 'CFG',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
  color: knativeServingColor.value,
};

export const KnativeServingModel: K8sKind = {
  apiGroup: 'operator.knative.dev',
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
  color: knativeServingColor.value,
};

export const KnativeEventingModel: K8sKind = {
  apiGroup: 'eventing.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'KnativeEventing',
  label: 'Knative Eventing',
  labelPlural: 'Knative Eventings',
  plural: 'knativeeventings',
  id: 'knativeeventing',
  abbr: 'KE',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const RevisionModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Revision',
  label: 'Revision',
  labelPlural: 'Revisions',
  plural: 'revisions',
  id: 'revision',
  abbr: 'REV',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
  color: knativeServingColor.value,
};

export const RouteModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Route',
  label: 'Route',
  labelPlural: 'Routes',
  plural: 'routes',
  id: 'route',
  abbr: 'RT',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
  color: knativeServingColor.value,
};

export const ServiceModel: K8sKind = {
  apiGroup: KNATIVE_SERVING_APIGROUP,
  apiVersion,
  kind: 'Service',
  label: 'Service',
  labelPlural: 'Services',
  plural: 'services',
  id: 'service',
  abbr: 'KSVC',
  namespaced: true,
  crd: true,
  badge: BadgeType.TECH,
  color: knativeServingColor.value,
};

export const EventSourceCronJobModel: K8sKind = {
  apiGroup: KNATIVE_EVENT_SOURCE_APIGROUP_DEP,
  apiVersion: 'v1alpha1',
  kind: 'CronJobSource',
  label: 'CronJob Source',
  labelPlural: 'CronJob Sources',
  plural: 'cronjobsources',
  id: 'cronjobsource',
  abbr: 'CJS',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const EventSourceContainerModel: K8sKind = {
  apiGroup: KNATIVE_EVENT_SOURCE_APIGROUP_DEP,
  apiVersion: 'v1alpha1',
  kind: 'ContainerSource',
  label: 'Container Source',
  labelPlural: 'Container Sources',
  plural: 'containersources',
  id: 'containersource',
  abbr: 'CS',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const EventSourceApiServerModel: K8sKind = {
  apiGroup: KNATIVE_EVENT_SOURCE_APIGROUP,
  apiVersion: 'v1alpha1',
  kind: 'ApiServerSource',
  label: 'ApiServerSource',
  labelPlural: 'ApiServerSources',
  plural: 'apiserversources',
  id: 'apiserversource',
  abbr: 'AS',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const EventSourceCamelModel: K8sKind = {
  apiGroup: KNATIVE_EVENT_SOURCE_APIGROUP_DEP,
  apiVersion: 'v1alpha1',
  kind: 'CamelSource',
  label: 'CamelSource',
  labelPlural: 'CamelSources',
  plural: 'camelsources',
  id: 'camelsource',
  abbr: 'CS',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const EventSourceKafkaModel: K8sKind = {
  apiGroup: KNATIVE_EVENT_SOURCE_APIGROUP_DEP,
  apiVersion: 'v1alpha1',
  kind: 'KafkaSource',
  label: 'KafkaSource',
  labelPlural: 'KafkaSources',
  plural: 'kafkasources',
  id: 'kafkasource',
  abbr: 'KS',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};

export const EventSourceSinkBindingModel: K8sKind = {
  apiGroup: KNATIVE_EVENT_SOURCE_APIGROUP,
  apiVersion: 'v1alpha1',
  kind: 'SinkBinding',
  label: 'SinkBinding',
  labelPlural: 'SinkBindings',
  plural: 'sinkbindings',
  id: 'sinkbindingsource',
  abbr: 'SBS',
  namespaced: true,
  crd: true,
  color: knativeEventingColor.value,
};
