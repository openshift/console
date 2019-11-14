import { VMKind, V1NetworkInterface, VMLikeEntityKind } from '../../types';
import { DEVICE_TYPE_DISK, DEVICE_TYPE_INTERFACE } from '../../constants';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { getDisks, getInterfaces } from './selectors';
import { asVM } from './vmlike';

type BootableDeviceType = {
  type: string;
  value: V1Disk | V1NetworkInterface;
};

export const getBootDeviceIndex = (devices, bootOrder) =>
  devices.findIndex((device) => device.bootOrder === bootOrder);

export const getDeviceBootOrder = (device, defaultValue?): number =>
  device && device.bootOrder === undefined ? defaultValue : device.bootOrder;

const getBootableDevices = (vm: VMKind): BootableDeviceType[] => {
  const disks = getDisks(vm)
    .filter((disk) => disk.bootOrder)
    .map((disk) => ({ type: DEVICE_TYPE_DISK, value: disk }));
  const nics = getInterfaces(vm)
    .filter((nic) => nic.bootOrder)
    .map((nic) => ({ type: DEVICE_TYPE_INTERFACE, value: nic }));

  return [...disks, ...nics];
};

export const getBootableDevicesInOrder = (vmLike: VMLikeEntityKind): BootableDeviceType[] => {
  const vm = asVM(vmLike);
  return getBootableDevices(vm).sort((a, b) => a.value.bootOrder - b.value.bootOrder);
};
