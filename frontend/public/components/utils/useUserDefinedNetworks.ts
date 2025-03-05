import { UserDefinedNetworkModel } from '@console/internal/models';
import { useK8sWatchResources } from './k8s-watch-hook';
import { useMemo } from 'react';
import {
  K8sResourceCommon,
  ResourcesObject,
  WatchK8sResource,
  WatchK8sResults,
} from '@console/dynamic-plugin-sdk';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';

type UseUserDefinedNetworkType = (
  namespaces: K8sResourceCommon[],
) => WatchK8sResults<ResourcesObject>;

const useUserDefinedNetworks: UseUserDefinedNetworkType = (namespaces) => {
  const watchRequest = useMemo(
    () =>
      namespaces?.reduce((request, namespaceResource) => {
        const namespace = namespaceResource?.metadata?.name;
        request[namespace] = {
          groupVersionKind: getGroupVersionKindForModel(UserDefinedNetworkModel),
          isList: true,
          namespace,
        };
        return request;
      }, {}) as { [namespace in string]: WatchK8sResource },
    [namespaces],
  );

  return useK8sWatchResources(watchRequest || {});
};

export default useUserDefinedNetworks;
