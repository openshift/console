import { FirehoseResource } from '@console/internal/components/utils/index';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import {
  PersistentVolumeModel,
  StorageClassModel,
  NodeModel,
  PersistentVolumeClaimModel,
  EventModel,
  SecretModel,
} from '@console/internal/models';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { SubscriptionModel } from '@console/operator-lifecycle-manager';
import { LocalVolumeDiscoveryResult } from '@console/local-storage-operator-plugin/src/models';
import {
  CephClusterModel,
  CephBlockPoolModel,
  OCSServiceModel,
  NooBaaBackingStoreModel,
  NooBaaNamespaceStoreModel,
} from './models';
import { CEPH_STORAGE_NAMESPACE } from './constants';
import { CAPACITY_USAGE_QUERIES, StorageDashboardQuery } from './queries';

export const cephClusterResource: FirehoseResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: false,
  isList: true,
  prop: 'ceph',
};

export const pvResource: WatchK8sResource = {
  kind: PersistentVolumeModel.kind,
  namespaced: false,
  isList: true,
};

export const pvcResource: FirehoseResource = {
  isList: true,
  kind: PersistentVolumeClaimModel.kind,
  prop: 'pvcs',
};

export const scResource: WatchK8sResource = {
  kind: StorageClassModel.kind,
  namespaced: false,
  isList: true,
};

export const LSOSubscriptionResource: WatchK8sResource = {
  kind: referenceForModel(SubscriptionModel),
  fieldSelector: 'metadata.name=local-storage-operator',
  isList: true,
};

export const subscriptionResource: FirehoseResource = {
  isList: true,
  kind: referenceForModel(SubscriptionModel),
  namespaced: false,
  prop: 'subs',
};

export const cephBlockPoolResource: WatchK8sResource = {
  kind: referenceForModel(CephBlockPoolModel),
  namespaced: true,
  isList: true,
  namespace: CEPH_STORAGE_NAMESPACE,
};

export const cephCapacityResource = {
  endpoint: PrometheusEndpoint.QUERY,
  namespace: CEPH_STORAGE_NAMESPACE,
  query: CAPACITY_USAGE_QUERIES[StorageDashboardQuery.CEPH_CAPACITY_USED],
};

export const nodeResource: WatchK8sResource = {
  kind: NodeModel.kind,
  namespaced: false,
  isList: true,
};

export const nodesDiscoveriesResource: WatchK8sResource = {
  kind: referenceForModel(LocalVolumeDiscoveryResult),
  namespaced: false,
  isList: true,
};

export const storageClusterResource: FirehoseResource = {
  isList: true,
  kind: referenceForModel(OCSServiceModel),
  namespaced: false,
  prop: 'storage-cluster',
};

export const eventsResource: FirehoseResource = {
  isList: true,
  kind: EventModel.kind,
  prop: 'events',
};

export const secretResource: FirehoseResource = {
  isList: false,
  kind: SecretModel.kind,
  prop: 'secret',
  namespace: CEPH_STORAGE_NAMESPACE,
  name: 'rook-ceph-external-cluster-details',
};

export const backingStoreResource = {
  kind: referenceForModel(NooBaaBackingStoreModel),
  isList: true,
  namespace: CEPH_STORAGE_NAMESPACE,
};

export const namespaceStoreResource = {
  kind: referenceForModel(NooBaaNamespaceStoreModel),
  isList: true,
  namespace: CEPH_STORAGE_NAMESPACE,
};
