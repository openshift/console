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
