import {
  useK8sWatchResource,
  getGroupVersionKindForModel,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { CloudCredentialModel } from '@console/internal/models';
import { CloudCredentialKind } from '@console/internal/module/k8s';

export const useClusterCloudCredentialConfig = (): WatchK8sResult<CloudCredentialKind> =>
  useK8sWatchResource<CloudCredentialKind>({
    groupVersionKind: getGroupVersionKindForModel(CloudCredentialModel),
    name: 'cluster',
  });
