import * as _ from 'lodash';
import { transformDevices } from '../vm/devices';
import { getVMIInterfaces, getVMIDisks } from './basic';
import { VMIKind } from '../../types/vm';
import { BootableDeviceType } from '../../types/types';

export const getVMIDevices = (vmi: VMIKind): BootableDeviceType[] => {
  return transformDevices(getVMIDisks(vmi), getVMIInterfaces(vmi));
};

const getVMISelectedBootableDevices = (vmi: VMIKind): BootableDeviceType[] => {
  const devices = getVMIDevices(vmi).filter((device) => device.value.bootOrder);
  return [...devices];
};

export const getVMIBootableDevicesInOrder = (vmi: VMIKind): BootableDeviceType[] =>
  _.sortBy(getVMISelectedBootableDevices(vmi), 'value.bootOrder');
