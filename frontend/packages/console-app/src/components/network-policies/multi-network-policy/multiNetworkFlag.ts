import { SetFeatureFlag, K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { k8sGetResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { FLAG_MULTI_NETWORK_POLICY, NetworkConfigModel } from './constants';

export const enableMultiNetworkPolicy = (setFeatureFlag: SetFeatureFlag) => {
  k8sGetResource({ model: NetworkConfigModel, name: 'cluster' })
    .then((networkClusterConfig: K8sResourceCommon & { spec: any }) => {
      if (networkClusterConfig?.spec?.disableMultiNetwork) {
        setFeatureFlag(FLAG_MULTI_NETWORK_POLICY, !networkClusterConfig.spec.disableMultiNetwork);
        return;
      }

      if (networkClusterConfig?.spec?.useMultiNetworkPolicy) {
        setFeatureFlag(FLAG_MULTI_NETWORK_POLICY, networkClusterConfig?.spec?.disableMultiNetwork);
        return;
      }

      setFeatureFlag(FLAG_MULTI_NETWORK_POLICY, false);
    })
    // eslint-disable-next-line no-console
    .catch(console.error);
};
