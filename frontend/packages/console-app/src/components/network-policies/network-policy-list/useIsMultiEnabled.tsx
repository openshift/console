import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NetworkConfigModel } from './constants';

type UseIsMultiEnabled = () => [boolean, boolean, any];

const useIsMultiEnabled: UseIsMultiEnabled = () => {
  const [networkClusterConfig, loaded, error] = useK8sWatchResource<
    K8sResourceCommon & { spec: any }
  >({
    groupVersionKind: getGroupVersionKindForModel(NetworkConfigModel),
    name: 'cluster',
  });

  if (networkClusterConfig?.spec?.disableMultiNetwork) {
    return [!networkClusterConfig?.spec?.disableMultiNetwork, loaded, error];
  }

  if (networkClusterConfig?.spec?.useMultiNetworkPolicy) {
    return [networkClusterConfig?.spec?.useMultiNetworkPolicy, loaded, error];
  }

  return [false, loaded, error];
};

export default useIsMultiEnabled;
