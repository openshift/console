import { K8sKind } from '@console/internal/module/k8s';

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

export const PodDisruptionBudgetModel: K8sKind = {
  label: 'PodDisruptionBudget',
  // t('console-app~PodDisruptionBudget')
  labelKey: 'console-app~PodDisruptionBudget',
  labelPlural: 'PodDisruptionBudgets',
  // t('console-app~PodDisruptionBudgets')
  labelPluralKey: 'console-app~PodDisruptionBudgets',
  plural: 'poddisruptionbudgets',
  apiVersion: 'v1',
  apiGroup: 'policy',
  abbr: 'PDB',
  namespaced: true,
  kind: 'PodDisruptionBudget',
  id: 'poddisruptionbudget',
};

export const EndPointSliceModel: K8sKind = {
  kind: 'EndpointSlice',
  label: 'EndpointSlice',
  labelPlural: 'EndpointSlices',
  apiGroup: 'discovery.k8s.io',
  apiVersion: 'v1',
  abbr: 'EPS',
  namespaced: true,
  plural: 'endpointslices',
};
