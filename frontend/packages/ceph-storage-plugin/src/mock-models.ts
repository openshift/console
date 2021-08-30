import { K8sKind } from '@console/internal/module/k8s';

// This model is used by HorizontalNav to limit the exposure of tabs to ODF Dashboard
export const StorageSystemMockModel: K8sKind = {
  label: 'StorageSystem',
  labelPlural: 'StorageSystems',
  apiVersion: 'v1',
  apiGroup: 'console.odf.io',
  plural: 'storagesystems',
  abbr: 'SS',
  namespaced: true,
  kind: 'StorageSystem',
  crd: true,
};
