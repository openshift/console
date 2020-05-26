import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import * as _ from 'lodash';
import { BootableDeviceType } from '../../types/types';
import { getBootableDevicesInOrder, getDevices } from '../vm/devices';
import { getVMIBootableDevicesInOrder, getVMIDevices } from '../vmi/devices';
import { createBasicLookup } from '@console/shared';
import { getSimpleName } from '../utils';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';

const cpuOmitPaths = ['dedicatedCpuPlacement', 'features', 'isolateEmulatorThread', 'model'];

export const isFlavorChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmCPU = _.omit(vm.getCPU(), cpuOmitPaths);
  const vmiCPU = _.omit(vmi.getCPU(), cpuOmitPaths);

  return (
    vm.getFlavor() !== vmi.getFlavor() ||
    !_.isEqual(vm.getMemory(), vmi.getMemory()) ||
    !_.isEqual(vmCPU, vmiCPU)
  );
};

export const isDisksChanged = (
  vm: VMWrapper,
  vmi: VMIWrapper,
  vmDsks?: V1Disk[],
  vmiDsks?: V1Disk[],
): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmDisks = vmDsks || vm.getDisks();
  const vmiDisks = vmiDsks || vmi.getDisks();

  if (vmDisks.length !== vmiDisks.length) {
    return true;
  }

  const vmVolumes = vm.getVolumesOfDisks(vmDisks);
  const vmiVolumes = vmi.getVolumesOfDisks(vmiDisks);

  if (vmVolumes.length !== vmiVolumes.length) {
    return true;
  }

  const vmiVolLookup = createBasicLookup(vmiVolumes, getSimpleName);
  const vmDiskLookup = createBasicLookup(vmDisks, getSimpleName);
  const vmiDiskLookup = createBasicLookup(vmiDisks, getSimpleName);

  return !vmVolumes.every((vol) => {
    const diskWrapper = new DiskWrapper(vmDiskLookup[vol.name]);
    const diskEquality = diskWrapper.isDiskEqual(vmiDiskLookup[vol.name], true);

    if (diskEquality) {
      const volWrapper = new VolumeWrapper(vol);
      return volWrapper.isVolumeEqual(vmiVolLookup[vol.name], true);
    }

    return false;
  });
};

export const isCDROMChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }
  return isDisksChanged(vm, vmi, vm.getCDROMs(), vmi.getCDROMs());
};

export const isBootOrderChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmBootOrder: BootableDeviceType[] = getBootableDevicesInOrder(vm.asResource(true));
  const vmiBootOrder: BootableDeviceType[] = getVMIBootableDevicesInOrder(vmi.asResource(true));

  if (vmBootOrder.length !== vmiBootOrder.length) {
    return true;
  }

  // Implicit boot order - no boot order is configured
  // Check whether the order of the disks in the YAML has changed
  if (vmBootOrder.length === 0) {
    const vmDevices = getDevices(vm.asResource());
    const vmiDevices = getVMIDevices(vmi.asResource());

    return vmDevices.every((bootableDevice, index) => _.isEqual(bootableDevice, vmiDevices[index]));
  }

  return !vmBootOrder.every(
    (device, index) =>
      device.type === vmiBootOrder[index].type &&
      device.typeLabel === vmiBootOrder[index].typeLabel &&
      device.value.bootOrder === vmiBootOrder[index].value.bootOrder &&
      device.value.name === vmiBootOrder[index].value.name,
  );
};

export const isNicsChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmNics = vm.getNetworkInterfaces();
  const vmiNics = vmi.getNetworkInterfaces();

  if (vmNics.length !== vmiNics.length) {
    return true;
  }

  const vmNicsLookup = createBasicLookup(vmNics, getSimpleName);
  const vmiNicsLookup = createBasicLookup(vmiNics, getSimpleName);

  return !Object.keys(vmNicsLookup).every(
    (vmNicName) =>
      !!vmiNicsLookup[vmNicName] && _.isEqual(vmiNicsLookup[vmNicName], vmNicsLookup[vmNicName]),
  );
};

export const isEnvDisksChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmEnvDiskVolumeNames = vm
    .getVolumes()
    .filter((vol) => new VolumeWrapper(vol).getType().isEnvType())
    .map((vol) => vol.name);

  const vmiEnvDiskVolumeNames = vmi
    .getVolumes()
    .filter((vol) => new VolumeWrapper(vol).getType().isEnvType())
    .map((vol) => vol.name);

  if (vmEnvDiskVolumeNames.length !== vmiEnvDiskVolumeNames.length) {
    return true;
  }
  const vmEnvDisks = vm.getDisks().filter((dsk) => vmEnvDiskVolumeNames.includes(dsk.name));
  const vmiEnvDisks = vmi.getDisks().filter((dsk) => vmiEnvDiskVolumeNames.includes(dsk.name));

  return isDisksChanged(vm, vmi, vmEnvDisks, vmiEnvDisks);
};
