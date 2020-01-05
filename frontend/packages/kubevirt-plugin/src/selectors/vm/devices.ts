import * as _ from 'lodash';
import { VMLikeEntityKind, BootableDeviceType } from '../../types';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { DeviceType } from '../../constants';
import { getDisks, getInterfaces } from './selectors';
import { asVM } from './vmlike';

export const getBootDeviceIndex = (devices, bootOrder) =>
  devices.findIndex((device) => device.bootOrder === bootOrder);

export const getDeviceBootOrder = (device, defaultValue?): number =>
  device && device.bootOrder === undefined ? defaultValue : device.bootOrder;

export const getDevices = (vmLikeEntity: VMLikeEntityKind): BootableDeviceType[] => {
  const vm = asVM(vmLikeEntity);

  const disks = getDisks(vm).map((disk) => ({
    type: DeviceType.DISK,
    typeLabel: DiskWrapper.initialize(disk)
      .getType()
      .toString(),
    value: disk,
  }));
  const nics = getInterfaces(vm).map((nic) => ({
    type: DeviceType.NIC,
    typeLabel: 'NIC',
    value: nic,
  }));

  return [...disks, ...nics];
};

export const getBootableDevices = (vm: VMLikeEntityKind): BootableDeviceType[] => {
  const devices = getDevices(vm).filter((device) => device.value.bootOrder);
  return [...devices];
};

export const getBootableDevicesInOrder = (vm: VMLikeEntityKind): BootableDeviceType[] =>
  _.sortBy(getBootableDevices(vm), 'value.bootOrder');

export const getNonBootableDevices = (vm: VMLikeEntityKind): BootableDeviceType[] => {
  const devices = getDevices(vm).filter((device) => !device.value.bootOrder);
  return [...devices];
};
