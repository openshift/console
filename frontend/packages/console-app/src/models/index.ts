import { K8sKind } from '@console/internal/module/k8s';

export const WorkspaceModel: K8sKind = {
  kind: 'DevWorkspace',
  label: 'DevWorkspace',
  labelPlural: 'devworkspaces',
  apiGroup: 'workspace.devfile.io',
  apiVersion: 'v1alpha2',
  abbr: 'DW',
  namespaced: true,
  crd: true,
  plural: 'devworkspaces',
  propagationPolicy: 'Background',
};

export const QuickStartModel: K8sKind = {
  kind: 'ConsoleQuickStart',
  label: 'ConsoleQuickStart',
  labelPlural: 'ConsoleQuickStarts',
  apiGroup: 'console.openshift.io',
  apiVersion: 'v1',
  abbr: 'CQS',
  namespaced: false,
  crd: true,
  plural: 'consolequickstarts',
  propagationPolicy: 'Background',
};
