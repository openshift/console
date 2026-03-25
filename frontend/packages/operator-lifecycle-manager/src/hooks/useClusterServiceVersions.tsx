import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import type { WatchK8sResult } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '../models';
import type { ClusterServiceVersionKind } from '../types';

export const useClusterServiceVersions = (namespace): WatchK8sResult<ClusterServiceVersionKind[]> =>
  useK8sWatchResource<ClusterServiceVersionKind[]>({
    groupVersionKind: getGroupVersionKindForModel(ClusterServiceVersionModel),
    namespaced: true,
    isList: true,
    namespace,
  });
