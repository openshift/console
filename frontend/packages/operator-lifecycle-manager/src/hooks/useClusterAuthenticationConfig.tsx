import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { AuthenticationModel } from '@console/internal/models';
import { AuthenticationKind } from '@console/internal/module/k8s';

export const useClusterAuthenticationConfig = (): WatchK8sResult<AuthenticationKind> =>
  useK8sWatchResource<AuthenticationKind>({
    groupVersionKind: getGroupVersionKindForModel(AuthenticationModel),
    name: 'cluster',
  });
