import { K8sModel } from '@console/dynamic-plugin-sdk/src';
import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { MultiNetworkPolicyModel } from '@console/internal/models';

export const NetworkConfigModel: K8sModel = {
  abbr: 'NO',
  apiGroup: 'operator.openshift.io',
  apiVersion: 'v1',
  crd: true,
  id: 'network',
  kind: 'Network',
  label: 'Network',
  labelPlural: 'Networks',
  namespaced: false,
  plural: 'networks',
};

export const ALL_NAMESPACES = 'all-namespaces';

export const multiNetworkPolicyRef = getReferenceForModel(MultiNetworkPolicyModel);

export const FLAG_MULTI_NETWORK_POLICY = 'MULTI_NETWORK_POLICY_ENABLED';
