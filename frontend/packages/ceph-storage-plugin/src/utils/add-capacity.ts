import { DeviceSet } from '../types';

export const getCurrentDeviceSetIndex = (deviceSets: DeviceSet[], selectedSCName: string): number =>
  deviceSets.findIndex((ds) => ds.dataPVCTemplate.spec.storageClassName === selectedSCName);
