import { FirehoseResource } from '@console/internal/components/utils/index';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { PersistentVolumeModel, StorageClassModel, NodeModel } from '@console/internal/models';
import { WatchK8sResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SubscriptionModel } from '@console/operator-lifecycle-manager';
import { LocalVolumeDiscoveryResult } from '@console/local-storage-operator-plugin/src/models';
import { LOCAL_STORAGE_NAMESPACE } from '@console/local-storage-operator-plugin/src/constants';
import { CephClusterModel, CephBlockPoolModel } from '../models';
import { CEPH_STORAGE_NAMESPACE } from '.';
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

export const scResource: WatchK8sResource = {
  kind: StorageClassModel.kind,
  namespaced: false,
  isList: true,
};

export const LSOSubscriptionResource: WatchK8sResource = {
  kind: referenceForModel(SubscriptionModel),
  namespace: LOCAL_STORAGE_NAMESPACE,
  isList: false,
  name: 'local-storage-operator',
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
