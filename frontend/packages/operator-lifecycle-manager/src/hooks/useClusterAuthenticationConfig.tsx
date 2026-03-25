import type { WatchK8sResult } from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { AuthenticationModel } from '@console/internal/models';
import type { AuthenticationKind } from '@console/internal/module/k8s';

export const useClusterAuthenticationConfig = (): WatchK8sResult<AuthenticationKind> =>
  useK8sWatchResource<AuthenticationKind>({
    groupVersionKind: getGroupVersionKindForModel(AuthenticationModel),
    name: 'cluster',
  });
