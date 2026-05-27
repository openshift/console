import type { K8sKind } from '@console/internal/module/k8s';

export const ClusterExtensionModel: K8sKind = {
  label: 'ClusterExtension',
  labelKey: 'olm-v1~ClusterExtension',
  labelPlural: 'ClusterExtensions',
  labelPluralKey: 'olm-v1~ClusterExtensions',
  apiVersion: 'v1',
  apiGroup: 'olm.operatorframework.io',
  plural: 'clusterextensions',
  abbr: 'CE',
  namespaced: false,
  kind: 'ClusterExtension',
  id: 'clusterextension',
  crd: true,
};
