import { FirehoseResource } from '@console/internal/components/utils/index';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { PersistentVolumeModel, StorageClassModel } from '@console/internal/models';
import { WatchK8sResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SubscriptionModel } from '@console/operator-lifecycle-manager';
import { LocalVolumeSetModel } from '@console/local-storage-operator-plugin/src/models';
import { LSO_NAMESPACE } from '@console/local-storage-operator-plugin/src/constants';
import { CephClusterModel } from '../models';

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

export const LVSResource: WatchK8sResource = {
  kind: referenceForModel(LocalVolumeSetModel),
  namespace: LSO_NAMESPACE,
  isList: true,
};

export const LSOSubscriptionResource: WatchK8sResource = {
  kind: referenceForModel(SubscriptionModel),
  namespace: LSO_NAMESPACE,
  isList: false,
  name: 'local-storage-operator',
};
