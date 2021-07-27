import * as React from 'react';
import { useK8sGet } from '../../components/utils/k8s-get-hook';
import { K8sResourceKind } from './types';
import { NetworkOperatorConfigModel } from '../../models';

const clusterNetworkModel = NetworkOperatorConfigModel;
const networkName = 'cluster';

/**
 * CNI type, or Unknown if the type can't be fetched (e.g. because the logged user does not
 * have permissions to fetch it)
 */
enum ClusterNetworkType {
  OpenShiftSDN = 'OpenShiftSDN',
  OVNKubernetes = 'OVNKubernetes',
  Unknown = 'Unknown',
}

export enum ClusterNetworkFeature {
  PolicyEgress = 'PolicyEgress',
  PolicyPeerIPBlockExceptions = 'PolicyPeerIPBlockExceptions',
}

export type ClusterNetworkFeatures = {
  [key in ClusterNetworkFeature]?: boolean;
};

/**
 * Main document depicting all the features that are supported by each supported CNI type.
 * Undefined features would require to take an ambiguous action (e.g. allow the customer
 * to set the policy Egress rule in a form, but show a warning explaining that this field is
 * not available for the Openshift SDN type)
 */
const featuresDocument: {
  [k in ClusterNetworkType]: ClusterNetworkFeatures;
} = {
  OpenShiftSDN: {
    PolicyEgress: false,
    PolicyPeerIPBlockExceptions: false,
  },
  OVNKubernetes: {
    PolicyEgress: true,
    PolicyPeerIPBlockExceptions: true,
  },
  Unknown: {},
};

/**
 *  Fetches and returns the features supported by the Cluster Network Type
 *  (Openshift SDN or Kubernetes OVN)
 *
 *  @async
 *  @returns [ClusterNetworkFeatures, boolean, any] - The asynchronously-loaded cluster network
 *  features, plus a boolean that is 'false' until the first value is loaded (or an error is
 *  returned)
 */
export const useClusterNetworkFeatures = (): [ClusterNetworkFeatures, boolean] => {
  const [features, setFeatures] = React.useState<ClusterNetworkFeatures>(
    featuresDocument[ClusterNetworkType.Unknown],
  );
  const [featuresLoaded, setFeaturesLoaded] = React.useState(false);
  const [network, networkLoaded] = useK8sGet<K8sResourceKind>(clusterNetworkModel, networkName);
  React.useEffect(() => {
    if (networkLoaded) {
      const cniType = ClusterNetworkType[network?.spec?.defaultNetwork?.type];
      setFeatures(featuresDocument[cniType ?? ClusterNetworkType.Unknown]);
      setFeaturesLoaded(true);
    }
  }, [network, networkLoaded]);

  return [features, featuresLoaded];
};
