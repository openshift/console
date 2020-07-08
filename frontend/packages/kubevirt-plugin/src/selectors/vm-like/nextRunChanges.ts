import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import * as _ from 'lodash';
import { BootableDeviceType } from '../../types/types';
import { VMKind, VMIKind } from '../../types/vm';
import { IsPendingChange } from '../../components/vms/types';
import { getBootableDevicesInOrder } from '../vm/devices';
import { getVMIBootableDevicesInOrder } from '../vmi/devices';
import { confirmVMIModal } from '../../components/modals/menu-actions-modals/confirm-vmi-modal';
import { getActionMessage } from '../../components/vms/constants';
import { VMActionType, restartVM } from '../../k8s/requests/vm';
import { createBasicLookup } from '@console/shared';
import { getSimpleName } from '../utils';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { VolumeType } from '../../constants/vm/storage/volume-type';

export const isFlavorChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  return (
    vm.getFlavor() !== vmi.getFlavor() ||
    !_.isEqual(vm.getMemory(), vmi.getMemory()) ||
    !_.isEqual(vm.getCPU(), vmi.getCPU())
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

  const vmVolumes = vm.getVolumesOfDisks(vmDisks || vm.getDisks());
  const vmiVolumes = vmi.getVolumesOfDisks(vmiDisks || vmi.getDisks());

  if (vmVolumes.length !== vmiVolumes.length) {
    return true;
  }

  const vmiVolLookup = createBasicLookup(vmiVolumes, getSimpleName);
  const vmDiskLookup = createBasicLookup(vmDisks, getSimpleName);
  const vmiDiskLookup = createBasicLookup(vmiDisks, getSimpleName);

  return !vmVolumes.every((vol) => {
    const volWrapper = new VolumeWrapper(vol);
    const vmDisk = vmDiskLookup[vol.name];

    const diskEqulity = _.isEqual(
      vmDisk,
      Object.keys(vmDisk).includes('cdrom')
        ? _.omit(vmiDiskLookup[vol.name], 'cdrom.readonly', 'cdrom.tray')
        : vmiDiskLookup[vol.name],
    );

    let volEquality = false;
    if (diskEqulity) {
      switch (volWrapper.getType()) {
        case VolumeType.CONTAINER_DISK:
          volEquality = _.isEqual(
            vol,
            _.omit(vmiVolLookup[vol.name], 'containerDisk.imagePullPolicy'),
          );
          break;
        default:
          volEquality = _.isEqual(vol, vmiVolLookup[vol.name]);
      }
    }

    return diskEqulity && volEquality;
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

  return !vmBootOrder.every(
    (device, index) =>
      device.type === vmiBootOrder[index].type &&
      device.typeLabel === vmiBootOrder[index].typeLabel &&
      device.value.bootOrder === vmiBootOrder[index].value.bootOrder &&
      device.value.name === vmiBootOrder[index].value.name,
  );
};

export const isEnvDisksChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmEnvDiskVolumeNames = [
    ...vm.getConfigMaps(),
    ...vm.getSecrets(),
    ...vm.getServiceAccounts(),
  ].map((vol) => vol.name);

  const vmiEnvDiskVolumeNames = [
    ...vmi.getConfigMaps(),
    ...vmi.getSecrets(),
    ...vmi.getServiceAccounts(),
  ].map((vol) => vol.name);

  if (vmEnvDiskVolumeNames.length !== vmiEnvDiskVolumeNames.length) {
    return true;
  }

  const vmEnvDisks = vm.getDisks().filter((dsk) => vmEnvDiskVolumeNames.includes(dsk.name));
  const vmiEnvDisks = vmi.getDisks().filter((dsk) => vmiEnvDiskVolumeNames.includes(dsk.name));

  return isDisksChanged(vm, vmi, vmEnvDisks, vmiEnvDisks);
};

export const detectNextRunChanges = (vm: VMKind, vmi: VMIKind) => {
  const vmWrapper = new VMWrapper(vm);
  const vmiWrapper = new VMIWrapper(vmi);

  return {
    [IsPendingChange.flavor]: !!vmi && isFlavorChanged(vmWrapper, vmiWrapper),
    [IsPendingChange.cdroms]: !!vmi && isCDROMChanged(vmWrapper, vmiWrapper),
    [IsPendingChange.bootOrder]: !!vmi && isBootOrderChanged(vmWrapper, vmiWrapper),
  };
};

export const saveAndRestartModal = (vm: VMKind, vmi: VMIKind, saveChanges: () => void) =>
  confirmVMIModal({
    vmi,
    title: 'Restart Virtual Machine',
    alertTitle: 'Restart Virtual Machine alert',
    message: getActionMessage(vm, VMActionType.Restart),
    btnText: _.capitalize(VMActionType.Restart),
    executeFn: () => {
      saveChanges();
      return restartVM(vm);
    },
    cancel: () => saveChanges(),
  });
