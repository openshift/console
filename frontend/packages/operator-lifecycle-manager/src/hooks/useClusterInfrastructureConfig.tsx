import type { WatchK8sResult } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { InfrastructureModel } from '@console/internal/models';
import type { InfrastructureKind } from '@console/internal/module/k8s';

export const useClusterInfrastructureConfig = (): WatchK8sResult<InfrastructureKind> =>
  useK8sWatchResource<InfrastructureKind>({
    groupVersionKind: getGroupVersionKindForModel(InfrastructureModel),
    name: 'cluster',
  });
