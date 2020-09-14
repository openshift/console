import { DeviceSet } from '../components/ocs-install/ocs-request-data';

export const getCurrentDeviceSetIndex = (deviceSets: DeviceSet[], selectedSCName: string): number =>
  deviceSets.findIndex((ds) => ds.dataPVCTemplate.spec.storageClassName === selectedSCName);
