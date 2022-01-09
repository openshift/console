import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';

export const ExportModel: K8sModel = {
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
