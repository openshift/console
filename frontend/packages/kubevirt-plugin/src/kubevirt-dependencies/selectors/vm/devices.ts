import * as _ from 'lodash';
import { DeviceType } from '../../constants/vm/constants';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { V1Disk } from '../../types/api';
import { BootableDeviceType } from '../../types/types';
import { V1NetworkInterface } from '../../types/vm';
import { VMLikeEntityKind } from '../../types/vm-like';
import { getBootableDisks, getDisks, getInterfaces } from './selectors';
import { asVM } from './vm';

export const getBootDeviceIndex = <D extends V1Disk | V1NetworkInterface>(
  devices: D[],
  bootOrder: number,
  deviceTypeFilter?: (device: D) => boolean,
) =>
  devices.findIndex(
    (device) =>
      device.bootOrder === bootOrder && (deviceTypeFilter ? deviceTypeFilter(device) : true),
  );

export const transformDevices = (
  disks: V1Disk[] = [],
  nics: V1NetworkInterface[] = [],
): BootableDeviceType[] => {
  const transformedDisks = disks.map((disk) => ({
    type: DeviceType.DISK,
    typeLabel: new DiskWrapper(disk).getType().toString(),
    value: disk,
  }));
  const transformedNics = nics.map((nic) => ({
    type: DeviceType.NIC,
    typeLabel: 'NIC',
    value: nic,
  }));

  return [...transformedDisks, ...transformedNics];
};

export const getTransformedDevices = (vmLikeEntity: VMLikeEntityKind): BootableDeviceType[] => {
  const vm = asVM(vmLikeEntity);
  return transformDevices(getDisks(vm), getInterfaces(vm));
};

export const getBootableDevices = (vmLikeEntity: VMLikeEntityKind): BootableDeviceType[] => {
  const vm = asVM(vmLikeEntity);
  return transformDevices(getBootableDisks(vm), getInterfaces(vm));
};

export const getSelectedBootableDevices = (vm: VMLikeEntityKind): BootableDeviceType[] => {
  const devices = getBootableDevices(vm).filter((device) => device.value.bootOrder);
  return [...devices];
};

export const getBootableDevicesInOrder = (
  vm: VMLikeEntityKind,
  bootableDevices?: BootableDeviceType[],
): BootableDeviceType[] =>
  _.sortBy(bootableDevices || getSelectedBootableDevices(vm), 'value.bootOrder');
