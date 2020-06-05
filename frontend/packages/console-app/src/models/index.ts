import { K8sKind } from '@console/internal/module/k8s';

export const WorkspaceModel: K8sKind = {
  kind: 'DevWorkspace',
  label: 'DevWorkspace',
  labelPlural: 'devworkspaces',
  apiGroup: 'workspace.devfile.io',
  apiVersion: 'v1alpha1',
  abbr: 'DW',
  namespaced: true,
  crd: true,
  plural: 'devworkspaces',
  propagationPolicy: 'Background',
};
