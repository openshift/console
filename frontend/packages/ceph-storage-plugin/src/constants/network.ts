import { NetworkType } from '../types';

export enum IP_FAMILY {
  IPV4 = 'IPV4',
  IPV6 = 'IPV6',
}

export const NetworkTypeLabels = {
  [NetworkType.DEFAULT]: 'Default (SDN)',
  [NetworkType.MULTUS]: 'Custom (Multus)',
};
