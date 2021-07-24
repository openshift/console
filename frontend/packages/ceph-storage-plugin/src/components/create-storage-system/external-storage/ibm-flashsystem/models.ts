import { K8sKind } from '@console/internal/module/k8s';

export const IBMFlashsystemModel: K8sKind = {
  label: 'IBM Flash System',
  labelPlural: 'IBM Flash Systems',
  apiVersion: 'v1alpha1',
  apiGroup: 'odf.ibm.com',
  plural: 'flashsystemclusters',
  abbr: 'FS',
  namespaced: true,
  kind: 'FlashSystemCluster',
  crd: true,
};
