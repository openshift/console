import { vmFlavorModal } from '../components/modals';
import { BootOrderModal } from '../components/modals/boot-order-modal';
import { hardwareDevicesModal } from '../components/modals/hardware-devices/HardwareDevicesModal';
import { IsPendingChange, PendingChanges, VMTabEnum, VMTabURLEnum } from '../components/vms/types';
import { VMIPhase } from '../constants/vmi/phase';
import { VMWrapper } from '../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../k8s/wrapper/vm/vmi-wrapper';
import {
  changedEnvDisks,
  changedGPUDevices,
  changedHostDevices,
  changedNics,
  isBootOrderChanged,
  isFlavorChanged,
} from '../selectors/vm-like/next-run-changes';
import { isVMRunningOrExpectedRunning } from '../selectors/vm/selectors';
import { VMIKind, VMKind } from '../types';
import { getVMTabURL, redirectToTab } from './url';

export const getPendingChanges = (vmWrapper: VMWrapper, vmiWrapper: VMIWrapper): PendingChanges => {
  const vm = vmWrapper.asResource();
  const vmi = vmiWrapper.asResource();
  const modifiedEnvDisks = changedEnvDisks(vmWrapper, vmiWrapper);
  const modifiedNics = changedNics(vmWrapper, vmiWrapper);
  const modifiedGPUDevices = changedGPUDevices(vmWrapper, vmiWrapper);
  const modifiedHostDevices = changedHostDevices(vmWrapper, vmiWrapper);

  return {
    [IsPendingChange.flavor]: {
      isPendingChange: isFlavorChanged(vmWrapper, vmiWrapper),
      execAction: () => {
        redirectToTab(getVMTabURL(vm, VMTabURLEnum.details));
        vmFlavorModal({ vmLike: vm, blocking: true });
      },
      vmTab: VMTabEnum.details,
    },
    [IsPendingChange.bootOrder]: {
      isPendingChange: isBootOrderChanged(vmWrapper, vmiWrapper),
      execAction: () => {
        redirectToTab(getVMTabURL(vm, VMTabURLEnum.details));
        BootOrderModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' });
      },
      vmTab: VMTabEnum.details,
    },
    [IsPendingChange.env]: {
      isPendingChange: modifiedEnvDisks.length > 0,
      execAction: () => redirectToTab(getVMTabURL(vm, VMTabURLEnum.env)),
      resourceNames: modifiedEnvDisks,
      vmTab: VMTabEnum.env,
    },
    [IsPendingChange.nics]: {
      isPendingChange: modifiedNics.length > 0,
      execAction: () => redirectToTab(getVMTabURL(vm, VMTabURLEnum.nics)),
      resourceNames: modifiedNics,
      vmTab: VMTabEnum.nics,
    },
    [IsPendingChange.hostDevices]: {
      isPendingChange: modifiedHostDevices.length > 0,
      execAction: () => {
        redirectToTab(getVMTabURL(vm, VMTabURLEnum.details));
        hardwareDevicesModal({
          isVMRunning: isVMRunningOrExpectedRunning(vm, vmi),
          vmLikeEntity: vm,
          vmName: vm?.metadata?.name,
          devices: vmWrapper.getHostDevices(),
          usedNames: vmWrapper.getUsedHardwareDevicesNames(),
          vmiWrapper,
        });
      },
      resourceNames: modifiedHostDevices,
      vmTab: VMTabEnum.details,
    },
    [IsPendingChange.gpuDevices]: {
      isPendingChange: modifiedGPUDevices.length > 0,
      execAction: () => {
        redirectToTab(getVMTabURL(vm, VMTabURLEnum.details));
        hardwareDevicesModal({
          isVMRunning: isVMRunningOrExpectedRunning(vm, vmi),
          vmLikeEntity: vm,
          vmName: vm?.metadata?.name,
          devices: vmWrapper.getGPUDevices(),
          isGPU: true,
          usedNames: vmWrapper.getUsedHardwareDevicesNames(),
          vmiWrapper,
        });
      },
      resourceNames: modifiedGPUDevices,
      vmTab: VMTabEnum.details,
    },
  };
};

export const hasPendingChanges = (vm: VMKind, vmi: VMIKind, pc?: PendingChanges): boolean => {
  const pendingChanges =
    pc ||
    (!!vmi &&
      vmi.status.phase !== VMIPhase.Succeeded &&
      getPendingChanges(new VMWrapper(vm), new VMIWrapper(vmi)));
  return Object.keys(pendingChanges || {}).reduce(
    (boolVal, k) => boolVal || pendingChanges[k].isPendingChange,
    false,
  );
};
