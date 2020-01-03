import { K8sKind } from '@console/internal/module/k8s';

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
