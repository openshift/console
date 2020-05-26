import * as _ from 'lodash';
import { transformDevices } from '../vm/devices';
import { getVMIInterfaces, getVMIDisks, getVMIVolumes } from './basic';
import { VMIKind } from '../../types/vm';
import { BootableDeviceType } from '../../types/types';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { createBasicLookup } from '@console/shared';
import { getSimpleName } from '../utils';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';

export const getVMIDevices = (vmi: VMIKind): BootableDeviceType[] => {
  return transformDevices(getVMIDisks(vmi), getVMIInterfaces(vmi));
};

const getVMIBootableDisks = (vmi: VMIKind, defaultValue: V1Disk[] = []): V1Disk[] => {
  const volumeLookup = createBasicLookup(getVMIVolumes(vmi), getSimpleName);
  return getVMIDisks(vmi, defaultValue).filter((disk) => {
    const volWrapper = new VolumeWrapper(volumeLookup[disk.name]);
    return !volWrapper.isEmpty() && volWrapper.getType() && !volWrapper.getType().isEnvType();
  });
};

export const getVMIBootableDevices = (vmi: VMIKind): BootableDeviceType[] => {
  return transformDevices(getVMIBootableDisks(vmi), getVMIInterfaces(vmi));
};

const getVMISelectedBootableDevices = (vmi: VMIKind): BootableDeviceType[] => {
  const devices = getVMIDevices(vmi).filter((device) => device.value.bootOrder);
  return [...devices];
};

export const getVMIBootableDevicesInOrder = (vmi: VMIKind): BootableDeviceType[] =>
  _.sortBy(getVMISelectedBootableDevices(vmi), 'value.bootOrder');
