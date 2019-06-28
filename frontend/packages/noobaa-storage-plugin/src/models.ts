import { K8sKind } from '@console/internal/module/k8s';

export const NooBaaSystemModel: K8sKind = {
  label: 'NooBaa System',
  labelPlural: 'NooBaa Systems',
  apiVersion: 'v1beta1',
  apiGroup: 'noobaa.rook.io',
  plural: 'noobaasystems',
  abbr: 'NB',
  namespaced: true,
  kind: 'NooBaaSystem',
  id: 'noobaasystem',
  crd: true,
};

export const NooBaaBackingStoreModel: K8sKind = {
  label: 'Backing Store',
  labelPlural: 'Backing Stores',
  apiVersion: 'v1beta1',
  apiGroup: 'noobaa.rook.io',
  plural: 'noobaabackingstores',
  abbr: 'NBS',
  namespaced: true,
  kind: 'NooBaaBackingStore',
  id: 'noobaabackingstore',
  crd: true,
};

export const NooBaaBucketClassModel: K8sKind = {
  label: 'Bucket Class',
  labelPlural: 'Bucket Classes',
  apiVersion: 'v1beta1',
  apiGroup: 'noobaa.rook.io',
  plural: 'noobaabucketclasses',
  abbr: 'NBC',
  namespaced: true,
  kind: 'NooBaaBucketClass',
  id: 'noobaabucketclasses',
  crd: true,
};
