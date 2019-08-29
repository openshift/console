import { FirehoseResource } from '@console/internal/components/utils/index';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { CephClusterModel } from '../models';

export const cephClusterResource: FirehoseResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: false,
  isList: true,
  prop: 'ceph',
};
export enum StorageDashboardResource {
  CEPH_CLUSTER_RESOURCE = 'CEPH_CLUSTER_RESOURCE',
}

export const STORAGE_HEALTH_RESOURCES = {
  [StorageDashboardResource.CEPH_CLUSTER_RESOURCE]: cephClusterResource,
};
