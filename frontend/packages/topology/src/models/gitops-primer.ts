import { K8sKind } from '@console/internal/module/k8s';

export const ExportModel: K8sKind = {
  id: 'export',
  kind: 'Export',
  plural: 'exports',
  label: 'Export',
  labelPlural: 'Exports',
  abbr: 'E',
  apiGroup: 'primer.gitops.io',
  apiVersion: 'v1alpha1',
  namespaced: true,
  crd: true,
};
