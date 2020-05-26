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
import { createBasicLookup } from '../../../../console-shared/src/utils/utils';
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
  vmDisks?: V1Disk[],
  vmiDisks?: V1Disk[],
): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }

  const vmVolumes = vm.getVolumesOfDisks(vmDisks || vm.getDisks());
  const vmiVolumes = vmi.getVolumesOfDisks(vmiDisks || vmi.getDisks());

  if (vmVolumes.length !== vmiVolumes.length) {
    return true;
  }

  const vmiVolLookup = createBasicLookup(vmiVolumes, getSimpleName);

  return !vmVolumes.every((vol) => {
    const volWrapper = new VolumeWrapper(vol);
    const volType = volWrapper.getType();
    switch (volType) {
      case VolumeType.CONTAINER_DISK:
        return _.isEqual(vol, _.omit(vmiVolLookup[vol.name], 'containerDisk.imagePullPolicy'));
      default:
        return _.isEqual(vol, vmiVolLookup[vol.name]);
    }
  });
};

export const isCDROMChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return false;
  }
  return isDisksChanged(vm, vmi, vm.getCDROMs(), vmi.getCDROMs());
};

export const isBootOrderChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (!vm || !vmi) {
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

export const getRemovedDiskNames = (vm: VMWrapper, vmi: VMIWrapper): string[] => {
  if (vm.isEmpty() || vmi.isEmpty()) {
    return [];
  }

  const vmDisks = vm.getDisks();
  return vmi
    .getDisks()
    .map((vmiDisk) => !vmDisks.find((vmDisk) => vmDisk.name === vmiDisk.name) && vmiDisk.name);
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
