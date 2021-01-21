import { BootableDeviceType } from '../../types';

export const deviceKey = (device: BootableDeviceType) => `${device.type}-${device.value.name}`;
export const deviceLabel = (device: BootableDeviceType) => {
  const name = device?.value?.name;

  if (name.match(/^\$\{[A-Z_]+\}$/)) {
    return `${name} (${device.typeLabel}), template parameter`;
  }

  return `${name} (${device.typeLabel})`;
};
