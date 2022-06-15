import { WatchK8sResourcesOptional } from '@console/dynamic-plugin-sdk';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src';
import { ServiceBindingModel } from '@console/service-binding-plugin/src/models';

export const getOperatorWatchedResources = (namespace: string): WatchK8sResourcesOptional<any> => {
  return {
    clusterServiceVersions: {
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespace,
      optional: true,
    },
  };
};

export const getServiceBindingWatchedResources = (
  namespace: string,
): WatchK8sResourcesOptional<any> => {
  return {
    serviceBindingRequests: {
      isList: true,
      kind: referenceForModel(ServiceBindingModel),
      namespace,
      optional: true,
    },
  };
};
