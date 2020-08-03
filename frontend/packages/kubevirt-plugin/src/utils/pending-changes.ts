import { VMWrapper } from '../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../k8s/wrapper/vm/vmi-wrapper';
import { PendingChanges, IsPendingChange, VMTabURLEnum, VMTabEnum } from '../components/vms/types';
import {
  isFlavorChanged,
  isBootOrderChanged,
  changedDisks,
  changedEnvDisks,
  changedNics,
} from '../selectors/vm-like/next-run-changes';
import { vmFlavorModal } from '../components/modals';
import { BootOrderModal } from '../components/modals/boot-order-modal';
import { VMKind, VMIKind } from '../types';
import { getVMTabURL, redirectToTab } from './url';

export const getPendingChanges = (vmWrapper: VMWrapper, vmiWrapper: VMIWrapper): PendingChanges => {
  const vm = vmWrapper.asResource();
  const modifiedDisks = changedDisks(vmWrapper, vmiWrapper);
  const modifiedEnvDisks = changedEnvDisks(vmWrapper, vmiWrapper);
  const modifiedNics = changedNics(vmWrapper, vmiWrapper);

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
    [IsPendingChange.disks]: {
      isPendingChange: modifiedDisks.length > 0,
      execAction: () => redirectToTab(getVMTabURL(vm, VMTabURLEnum.disks)),
      resourceNames: modifiedDisks,
      vmTab: VMTabEnum.disks,
    },
  };
};

export const hasPendingChanges = (vm: VMKind, vmi: VMIKind, pc?: PendingChanges): boolean => {
  const pendingChanges = pc || (!!vmi && getPendingChanges(new VMWrapper(vm), new VMIWrapper(vmi)));
  return Object.keys(pendingChanges || {}).reduce(
    (boolVal, k) => boolVal || pendingChanges[k].isPendingChange,
    false,
  );
};
