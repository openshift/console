export const POD_NETWORK = 'Pod Networking';

export enum NetworkType {
  MULTUS = 'multus', // compatible with web-ui-components constants
  POD = 'pod',
}

export enum NetworkBinding {
  MASQUERADE = 'masquerade',
  BRIDGE = 'bridge',
  SRIOV = 'sriov',
}
