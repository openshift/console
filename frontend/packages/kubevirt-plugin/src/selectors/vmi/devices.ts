import * as _ from 'lodash';
import { BootableDeviceType } from '../../types/types';
import { VMIKind } from '../../types/vm';
import { transformDevices } from '../vm/devices';
import { getVMIDisks, getVMIInterfaces } from './basic';

export const getVMIDevices = (vmi: VMIKind): BootableDeviceType[] => {
  return transformDevices(getVMIDisks(vmi), getVMIInterfaces(vmi));
};

const getVMISelectedBootableDevices = (vmi: VMIKind): BootableDeviceType[] => {
  const devices = getVMIDevices(vmi).filter((device) => device.value.bootOrder);
  return [...devices];
};

export const getVMIBootableDevicesInOrder = (vmi: VMIKind): BootableDeviceType[] =>
  _.sortBy(getVMISelectedBootableDevices(vmi), 'value.bootOrder');
