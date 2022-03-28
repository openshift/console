import { K8sKind } from '@console/internal/module/k8s';

export const InstallPlanModel: K8sKind = {
  kind: 'InstallPlan',
  label: 'InstallPlan',
  // t('console-shared~InstallPlan')
  labelKey: 'olm~InstallPlan',
  labelPlural: 'InstallPlans',
  // t('console-shared~InstallPlans')
  labelPluralKey: 'olm~InstallPlans',
  apiGroup: 'operators.coreos.com',
  apiVersion: 'v1alpha1',
  abbr: 'IP',
  namespaced: true,
  crd: true,
  plural: 'installplans',
  legacyPluralURL: true,
};
