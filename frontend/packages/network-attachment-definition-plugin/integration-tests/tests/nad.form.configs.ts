import { OrderedMap } from 'immutable';
import { NADConfig } from '../types';
import { CNV_BRIDGE, CONFIG_NAME_CNV_BRIDGE, CONFIG_NAME_INVALID_NAME } from './utils/constants';

export const getNADConfigs = (testName: string) =>
  OrderedMap<string, NADConfig>()
    .set(CONFIG_NAME_CNV_BRIDGE, {
      name: testName,
      namespace: testName,
      description: 'test description for CNV bridge',
      networkType: CNV_BRIDGE,
      bridgeName: 'br0',
      vlanTagNum: '100',
    })
    .set(CONFIG_NAME_INVALID_NAME, {
      name: `${testName}-`,
      namespace: testName,
      networkType: CNV_BRIDGE,
      bridgeName: 'br1',
    });
