import { K8sKind } from '@console/internal/module/k8s';

const v1alpha1 = 'v1alpha1';
const v1beta1 = 'v1beta1';

export const ConfigurationModelAlpha: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1alpha1,
  kind: 'Configuration',
  plural: 'configurations',
  label: 'Configuration',
  labelPlural: 'Configurations',
  id: 'configuration',
  abbr: 'C',
  namespaced: true,
  crd: true,
};

export const KnativeServingModelAlpha: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1alpha1,
  kind: 'KnativeServing',
  label: 'Knative Serving',
  labelPlural: 'Knative Servings',
  plural: 'knativeservings',
  id: 'knativeserving',
  abbr: 'KS',
  namespaced: true,
  crd: true,
};

export const RevisionModelAlpha: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1alpha1,
  kind: 'Revision',
  label: 'Revision',
  labelPlural: 'Revisions',
  plural: 'revisions',
  id: 'revision',
  abbr: 'R',
  namespaced: true,
  crd: true,
};

export const RouteModelAlpha: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1alpha1,
  kind: 'Route',
  label: 'Route',
  labelPlural: 'Routes',
  plural: 'routes',
  id: 'route',
  abbr: 'R',
  namespaced: true,
  crd: true,
};

export const ServiceModelAlpha: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1alpha1,
  kind: 'Service',
  label: 'Service',
  labelPlural: 'Services',
  plural: 'services',
  id: 'service',
  abbr: 'S',
  namespaced: true,
  crd: true,
};

// Beta models
export const ConfigurationModelBeta: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1beta1,
  kind: 'Configuration',
  plural: 'configurations',
  label: 'Configuration',
  labelPlural: 'Configurations',
  id: 'configuration',
  abbr: 'C',
  namespaced: true,
  crd: true,
};

export const KnativeServingModelBeta: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1beta1,
  kind: 'KnativeServing',
  label: 'Knative Serving',
  labelPlural: 'Knative Servings',
  plural: 'knativeservings',
  id: 'knativeserving',
  abbr: 'KS',
  namespaced: true,
  crd: true,
};

export const RevisionModelBeta: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1beta1,
  kind: 'Revision',
  label: 'Revision',
  labelPlural: 'Revisions',
  plural: 'revisions',
  id: 'revision',
  abbr: 'R',
  namespaced: true,
  crd: true,
};

export const RouteModelBeta: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1beta1,
  kind: 'Route',
  label: 'Route',
  labelPlural: 'Routes',
  plural: 'routes',
  id: 'route',
  abbr: 'R',
  namespaced: true,
  crd: true,
};

export const ServiceModelBeta: K8sKind = {
  apiGroup: 'serving.knative.dev',
  apiVersion: v1beta1,
  kind: 'Service',
  label: 'Service',
  labelPlural: 'Services',
  plural: 'services',
  id: 'service',
  abbr: 'S',
  namespaced: true,
  crd: true,
};
