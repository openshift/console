import * as React from 'react';
import { useK8sGet } from '../../components/utils/k8s-get-hook';
import { K8sResourceKind } from './types';
import { ConfigMapModel } from '../../models';

const networkConfigMapName = 'openshift-network-features';
const networkConfigMapNamespace = 'openshift-config-managed';
const policyEgressConfigKey = 'policy_egress';
const policyPeerIPBlockExceptionsConfigKey = 'policy_peer_ipblock_exceptions';

export enum ClusterNetworkFeature {
  PolicyEgress = 'PolicyEgress',
  PolicyPeerIPBlockExceptions = 'PolicyPeerIPBlockExceptions',
}

export type ClusterNetworkFeatures = {
  [key in ClusterNetworkFeature]?: boolean;
};

const getFeatureState = (data: { [key: string]: string }, key: string): boolean | undefined => {
  // Note: config map data comes as string, not bool
  return data.hasOwnProperty(key) ? data[key] === 'true' : undefined;
};

/**
 *  Fetches and returns the features supported by the Cluster Network Type
 *  (Openshift SDN, Kubernetes OVN ...) using a config map provided by the
 *  cluster network operator.
 *
 *  @async
 *  @returns [ClusterNetworkFeatures, boolean, any] - The asynchronously-loaded cluster network
 *  features, plus a boolean that is 'false' until the first value is loaded (or an error is
 *  returned)
 */
export const useClusterNetworkFeatures = (): [ClusterNetworkFeatures, boolean] => {
  const [features, setFeatures] = React.useState<ClusterNetworkFeatures>({});
  const [featuresLoaded, setFeaturesLoaded] = React.useState(false);
  const [config, configLoaded] = useK8sGet<K8sResourceKind>(
    ConfigMapModel,
    networkConfigMapName,
    networkConfigMapNamespace,
  );
  React.useEffect(() => {
    if (configLoaded && config?.data) {
      setFeatures({
        PolicyEgress: getFeatureState(config.data, policyEgressConfigKey),
        PolicyPeerIPBlockExceptions: getFeatureState(
          config.data,
          policyPeerIPBlockExceptionsConfigKey,
        ),
      });
      setFeaturesLoaded(true);
    }
  }, [config, configLoaded]);

  return [features, featuresLoaded];
};
