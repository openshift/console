import * as _ from 'lodash';
import { VMLikeEntityKind, BootableDeviceType } from '../../types';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { DEVICE_TYPE_DISK, DEVICE_TYPE_INTERFACE } from '../../constants';
import { getDisks, getInterfaces } from './selectors';
import { asVM } from './vmlike';

export const getBootDeviceIndex = (devices, bootOrder) =>
  devices.findIndex((device) => device.bootOrder === bootOrder);

export const getDeviceBootOrder = (device, defaultValue?): number =>
  device && device.bootOrder === undefined ? defaultValue : device.bootOrder;

export const getDevices = (vm: VMLikeEntityKind): BootableDeviceType[] => {
  const disks = getDisks(asVM(vm)).map((disk) => ({
    type: DEVICE_TYPE_DISK,
    typeLabel: DiskWrapper.initialize(disk)
      .getType()
      .toString(),
    value: disk,
  }));
  const nics = getInterfaces(asVM(vm)).map((nic) => ({
    type: DEVICE_TYPE_INTERFACE,
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
