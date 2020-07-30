import { VMWrapper } from '../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../k8s/wrapper/vm/vmi-wrapper';
import { PendingChanges, IsPendingChange, VMTabURLEnum, VMTabEnum } from '../components/vms/types';
import {
  isFlavorChanged,
  isBootOrderChanged,
  isEnvDisksChanged,
  isNicsChanged,
  isDisksChanged,
} from '../selectors/vm-like/next-run-changes';
import { vmFlavorModal } from '../components/modals';
import { BootOrderModal } from '../components/modals/boot-order-modal';
import { history } from '@console/internal/components/utils/router';
import { VMKind, VMIKind } from '../types';
import { getVMTabURL } from './url';

export const getPendingChanges = (vmWrapper: VMWrapper, vmiWrapper: VMIWrapper): PendingChanges => {
  const vm = vmWrapper.asResource();
  return {
    [IsPendingChange.flavor]: {
      isPendingChange: isFlavorChanged(vmWrapper, vmiWrapper),
      execAction: () => {
        history.push(getVMTabURL(vm, VMTabURLEnum.details));
        vmFlavorModal({ vmLike: vm, blocking: true });
      },
      vmTab: VMTabEnum.details,
    },
    [IsPendingChange.bootOrder]: {
      isPendingChange: isBootOrderChanged(vmWrapper, vmiWrapper),
      execAction: () => {
        history.push(getVMTabURL(vm, VMTabURLEnum.details));
        BootOrderModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' });
      },
      vmTab: VMTabEnum.details,
    },
    [IsPendingChange.env]: {
      isPendingChange: isEnvDisksChanged(vmWrapper, vmiWrapper),
      execAction: () => history.push(getVMTabURL(vm, VMTabURLEnum.env)),
      vmTab: VMTabEnum.env,
    },
    [IsPendingChange.nics]: {
      isPendingChange: isNicsChanged(vmWrapper, vmiWrapper),
      execAction: () => history.push(getVMTabURL(vm, VMTabURLEnum.nics)),
      vmTab: VMTabEnum.nics,
    },
    [IsPendingChange.disks]: {
      isPendingChange: isDisksChanged(vmWrapper, vmiWrapper),
      execAction: () => history.push(getVMTabURL(vm, VMTabURLEnum.disks)),
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
