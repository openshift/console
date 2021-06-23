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

export const v1alpha1WorkspaceModel: K8sKind = Object.assign(
  { ...WorkspaceModel },
  {
    apiVersion: 'v1alpha1',
  },
);

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

export const MultiClusterHubModel: K8sKind = {
  kind: 'MultiClusterHub',
  label: 'MultiClusterHub',
  labelPlural: 'MultiClusterhubs',
  apiGroup: 'operator.open-cluster-management.io',
  apiVersion: 'v1',
  abbr: 'MCH',
  namespaced: false,
  crd: true,
  plural: 'multiclusterhubs',
  propagationPolicy: 'Background',
};
