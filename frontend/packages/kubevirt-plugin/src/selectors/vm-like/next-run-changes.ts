import * as _ from 'lodash';
import { createBasicLookup } from '@console/shared';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { V1Disk } from '../../types/api';
import { BootableDeviceType } from '../../types/types';
import { V1NetworkInterface } from '../../types/vm/index';
import { getSimpleName } from '../utils';
import { getBootableDevicesInOrder, getTransformedDevices } from '../vm/devices';
import { getVMIBootableDevicesInOrder, getVMIDevices } from '../vmi/devices';

const cpuOmitPaths = ['dedicatedCpuPlacement', 'features', 'isolateEmulatorThread', 'model'];

export const isFlavorChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmCPU = _.omit(vm.getCPU(), cpuOmitPaths);
  const vmiCPU = _.omit(vmi.getCPU(), cpuOmitPaths);
  const vmMemory = vm.getMemory();
  const vmiMemory = vmi.getMemory();
  const vmFlavor = vm.getFlavor();
  const vmiFlvor = vmi.getFlavor();

  return (
    (vmFlavor && !_.isEqual(vmFlavor, vmiFlvor)) ||
    (vmMemory && !_.isEqual(vmMemory, vmiMemory)) ||
    (!_.isEmpty(vmCPU) && !_.isEqual(vmCPU, vmiCPU))
  );
};

export const changedDisks = (
  vm: VMWrapper,
  vmi: VMIWrapper,
  vmDsks?: V1Disk[],
  vmiDsks?: V1Disk[],
): string[] => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return [];
  }

  const vmDisks = vmDsks || vm.getDisks();
  const vmiDisks = vmiDsks || vmi.getDisks();
  const vmVolumes = vm.getVolumesOfDisks(vmDisks);

  const vmiVolLookup = createBasicLookup(vmi.getVolumesOfDisks(vmiDisks), getSimpleName);
  const vmDiskLookup = createBasicLookup(vmDsks || vm.getDisks(), getSimpleName);
  const vmiDiskLookup = createBasicLookup(vmiDisks, getSimpleName);

  return vmVolumes
    .reduce((acc, vol) => {
      let diskEquality = false;
      let volumeEquality = false;

      const diskWrapper = new DiskWrapper(vmDiskLookup[vol.name]);

      diskEquality =
        !!vmiDiskLookup[vol.name] && diskWrapper.isDiskEqual(vmiDiskLookup[vol.name], true, true);

      if (diskEquality) {
        const volWrapper = new VolumeWrapper(vol);
        volumeEquality =
          !!vmiVolLookup[vol.name] && volWrapper.isVolumeEqual(vmiVolLookup[vol.name], true);
      }

      return !diskEquality || !volumeEquality ? [...acc, diskWrapper.asResource()] : [...acc];
    }, [])
    .map((disk) => disk.name);
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
    const vmDevices = getTransformedDevices(vm.asResource());
    const vmiDevices = getVMIDevices(vmi.asResource());

    return vmDevices.some((bootableDevice, index) => !_.isEqual(bootableDevice, vmiDevices[index]));
  }

  return !vmBootOrder.every(
    (device, index) =>
      device.type === vmiBootOrder[index].type &&
      device.typeLabel === vmiBootOrder[index].typeLabel &&
      device.value.bootOrder === vmiBootOrder[index].value.bootOrder &&
      device.value.name === vmiBootOrder[index].value.name,
  );
};

export const changedNics = (vm: VMWrapper, vmi: VMIWrapper): string[] => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return [];
  }

  const vmNics = vm.getNetworkInterfaces();
  const vmiNics = vmi.getNetworkInterfaces();

  const vmNicsLookup: { [name: string]: V1NetworkInterface } = createBasicLookup(
    vmNics,
    getSimpleName,
  );
  const vmiNicsLookup: { [name: string]: V1NetworkInterface } = createBasicLookup(
    vmiNics,
    getSimpleName,
  );

  return Object.keys(vmNicsLookup).reduce(
    (acc, nicName) =>
      !vmiNicsLookup[nicName] ||
      !_.isEqual(
        _.omit(vmiNicsLookup[nicName], 'bootOrder'),
        _.omit(vmNicsLookup[nicName], 'bootOrder'),
      )
        ? [...acc, nicName]
        : [...acc],
    [],
  );
};

export const changedEnvDisks = (vm: VMWrapper, vmi: VMIWrapper): string[] => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return [];
  }

  const vmVolumes = vm.getVolumes();

  const vmEnvDiskVolumeNames = vmVolumes
    .filter((vol) => new VolumeWrapper(vol).getType()?.isEnvType())
    .map((vol) => vol.name);

  const vmiEnvDiskVolumeNames = vmi
    .getVolumes()
    .filter((vol) => new VolumeWrapper(vol).getType()?.isEnvType())
    .map((vol) => vol.name);

  const vmEnvDisks = vm.getDisks().filter((dsk) => vmEnvDiskVolumeNames.includes(dsk.name));
  const vmiEnvDisks = vmi.getDisks().filter((dsk) => vmiEnvDiskVolumeNames.includes(dsk.name));

  const vmVolumesLookup = createBasicLookup(vmVolumes, getSimpleName);
  return changedDisks(vm, vmi, vmEnvDisks, vmiEnvDisks).map(
    (diskName) => new VolumeWrapper(vmVolumesLookup[diskName]).getReferencedObject()?.name,
  );
};
