import { K8sKind } from '@console/internal/module/k8s';

export const WorkspaceModel: K8sKind = {
  kind: 'Workspace',
  label: 'Workspace',
  labelPlural: 'workspaces',
  apiGroup: 'workspace.che.eclipse.org',
  apiVersion: 'v1alpha1',
  abbr: 'WS',
  namespaced: true,
  crd: true,
  plural: 'workspaces',
  propagationPolicy: 'Foreground',
};

export const DevWorkspaceModel: K8sKind = {
  kind: 'DevWorkspace',
  label: 'Devworkspace',
  labelPlural: 'workspaces',
  apiGroup: 'apiextensions.k8s.io',
  apiVersion: 'v1alpha1',
  abbr: 'DW',
  namespaced: true,
  crd: true,
  plural: 'devworkspaces',
  propagationPolicy: 'Foreground',
};
