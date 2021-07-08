import { K8sKind } from '@console/internal/module/k8s';

export const CephClusterModel: K8sKind = {
  label: 'Ceph Cluster',
  labelPlural: 'Ceph Clusters',
  apiVersion: 'v1',
  apiGroup: 'ceph.rook.io',
  plural: 'cephclusters',
  abbr: 'CC',
  namespaced: true,
  kind: 'CephCluster',
  id: 'cephcluster',
  crd: true,
};

export const OCSServiceModel: K8sKind = {
  label: 'Storage Cluster',
  labelPlural: 'Storage Clusters',
  apiVersion: 'v1',
  apiGroup: 'ocs.openshift.io',
  plural: 'storageclusters',
  abbr: 'OCS',
  namespaced: true,
  kind: 'StorageCluster',
  id: 'ocscluster',
  crd: true,
};

export const CephBlockPoolModel: K8sKind = {
  label: 'BlockPool',
  labelPlural: 'BlockPools',
  apiVersion: 'v1',
  apiGroup: 'ceph.rook.io',
  plural: 'cephblockpools',
  abbr: 'CBP',
  namespaced: true,
  kind: 'CephBlockPool',
  id: 'cephblockpools',
  crd: true,
};

export const CephObjectStoreModel: K8sKind = {
  label: 'Ceph Object Store',
  labelPlural: 'Ceph Object Stores',
  apiVersion: 'v1',
  apiGroup: 'ceph.rook.io',
  plural: 'cephobjectstores',
  abbr: 'COS',
  namespaced: true,
  kind: 'CephObjectStore',
  id: 'cephobjectstores',
  crd: true,
};

export const NooBaaSystemModel: K8sKind = {
  label: 'NooBaa System',
  labelPlural: 'NooBaa Systems',
  apiVersion: 'v1alpha1',
  apiGroup: 'noobaa.io',
  plural: 'noobaas',
  abbr: 'NB',
  namespaced: true,
  kind: 'NooBaa',
  id: 'noobaasystem',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaBackingStoreModel: K8sKind = {
  label: 'Backing Store',
  labelPlural: 'Backing Stores',
  apiVersion: 'v1alpha1',
  apiGroup: 'noobaa.io',
  plural: 'backingstores',
  abbr: 'NBS',
  namespaced: true,
  kind: 'BackingStore',
  id: 'noobaabackingstore',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaNamespaceStoreModel: K8sKind = {
  label: 'Namespace Store',
  labelPlural: 'Namespace Stores',
  apiVersion: 'v1alpha1',
  apiGroup: 'noobaa.io',
  plural: 'namespacestores',
  abbr: 'NNS',
  namespaced: true,
  kind: 'NamespaceStore',
  id: 'noobaanamespacestore',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaBucketClassModel: K8sKind = {
  label: 'Bucket Class',
  labelPlural: 'Bucket Classes',
  apiVersion: 'v1alpha1',
  apiGroup: 'noobaa.io',
  plural: 'bucketclasses',
  abbr: 'NBC',
  namespaced: true,
  kind: 'BucketClass',
  id: 'noobaabucketclasses',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaObjectBucketClaimModel: K8sKind = {
  label: 'Object Bucket Claim',
  labelPlural: 'Object Bucket Claims',
  apiVersion: 'v1alpha1',
  apiGroup: 'objectbucket.io',
  plural: 'objectbucketclaims',
  abbr: 'OBC',
  namespaced: true,
  kind: 'ObjectBucketClaim',
  id: 'objectbucketclaims',
  crd: true,
  legacyPluralURL: true,
};

export const NooBaaObjectBucketModel: K8sKind = {
  label: 'Object Bucket',
  labelPlural: 'Object Buckets',
  apiVersion: 'v1alpha1',
  apiGroup: 'objectbucket.io',
  plural: 'objectbuckets',
  abbr: 'OB',
  namespaced: false,
  kind: 'ObjectBucket',
  id: 'objectbucket',
  crd: true,
  legacyPluralURL: true,
};
