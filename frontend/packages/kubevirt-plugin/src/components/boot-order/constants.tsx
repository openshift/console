import { BootableDeviceType } from '../../types';

export const deviceKey = (device: BootableDeviceType) => `${device.type}-${device.value.name}`;
export const deviceLabel = (device: BootableDeviceType) =>
  `${device.value.name} (${device.typeLabel})`;
