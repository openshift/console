import { K8sModel } from '../api/common-types';

export const ProjectModel: K8sModel = {
  abbr: 'PR',
  label: 'Project',
  apiVersion: 'v1',
  apiGroup: 'project.openshift.io',
  plural: 'projects',
  kind: 'Project',
  labelPlural: 'Projects',
};

export const SelfSubjectAccessReviewModel: K8sModel = {
  abbr: 'SSAR',
  kind: 'SelfSubjectAccessReview',
  label: 'SelfSubjectAccessReview',
  labelPlural: 'SelfSubjectAccessReviews',
  plural: 'selfsubjectaccessreviews',
  apiVersion: 'v1',
  apiGroup: 'authorization.k8s.io',
};

export const BuildConfigModel: K8sModel = {
  label: 'BuildConfig',
  apiVersion: 'v1',
  apiGroup: 'build.openshift.io',
  plural: 'buildconfigs',
  abbr: 'BC',
  namespaced: true,
  propagationPolicy: 'Foreground',
  kind: 'BuildConfig',
  id: 'buildconfig',
  labelPlural: 'BuildConfigs',
};

export const HorizontalPodAutoscalerModel: K8sModel = {
  label: 'HorizontalPodAutoscaler',
  plural: 'horizontalpodautoscalers',
  apiVersion: 'v2',
  apiGroup: 'autoscaling',
  abbr: 'HPA',
  namespaced: true,
  kind: 'HorizontalPodAutoscaler',
  id: 'horizontalpodautoscaler',
  labelPlural: 'HorizontalPodAutoscalers',
};
