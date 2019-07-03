export const POD_NETWORK = 'Pod Networking';

export enum NetworkType {
  MULTUS = 'multus',
  POD = 'pod',
}

export enum NetworkBinding {
  MASQUERADE = 'masquerade',
  BRIDGE = 'bridge',
  SRIOV = 'sriov',
}
