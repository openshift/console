import { BootableDeviceType } from '../../types';

export const addItemMessage = 'Add source';
export const addItemDisabledMessage = 'All sources selected';
export const addItemSelectLabel = 'Please select a boot source';
export const bootOrderEmptyTitle = 'No resource selected';
export const bootOrderEmptyMessage =
  'VM will attempt to boot from disks by order of apearance in YAML file';
export const bootOrderAriaLabel = 'VM Boot Order List';

export const deviceKey = (device: BootableDeviceType) => `${device.type}-${device.value.name}`;
export const deviceLabel = (device: BootableDeviceType) =>
  `${device.value.name} (${device.typeLabel})`;
