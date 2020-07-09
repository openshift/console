import { K8sKind } from '@console/internal/module/k8s';

export const GitOpsServiceModel: K8sKind = {
  apiGroup: 'pipelines.openshift.io',
  apiVersion: 'v1alpha1',
  kind: 'GitopsService',
  id: 'gitopsservice',
  plural: 'gitopsservices',
  label: 'Gitops Service',
  labelPlural: 'Gitops Services',
  abbr: 'GS',
  namespaced: true,
  crd: true,
};
