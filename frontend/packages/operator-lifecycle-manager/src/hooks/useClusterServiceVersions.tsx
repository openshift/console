import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { WatchK8sResult } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind } from '../types';

export const useClusterServiceVersions = (namespace): WatchK8sResult<ClusterServiceVersionKind[]> =>
  useK8sWatchResource<ClusterServiceVersionKind[]>({
    groupVersionKind: getGroupVersionKindForModel(ClusterServiceVersionModel),
    namespaced: true,
    isList: true,
    namespace,
  });
