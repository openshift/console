import { K8sKind } from '@console/internal/module/k8s';

export const ConfigurationModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'Configuration',
  plural: 'configurations',
  label: 'Configuration',
  labelPlural: 'Configurations',
  id: 'configuration',
  abbr: 'C',
  namespaced: true,
  crd: true,
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
};

export const RevisionModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'Revision',
  label: 'Revision',
  labelPlural: 'Revisions',
  plural: 'revisions',
  id: 'revision',
  abbr: 'R',
  namespaced: true,
  crd: true,
};

export const RouteModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'Route',
  label: 'Route',
  labelPlural: 'Routes',
  plural: 'routes',
  id: 'route',
  abbr: 'R',
  namespaced: true,
  crd: true,
};

export const ServiceModel: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: 'v1alpha1',
  kind: 'Service',
  label: 'Service',
  labelPlural: 'Services',
  plural: 'services',
  id: 'service',
  abbr: 'S',
  namespaced: true,
  crd: true,
};
