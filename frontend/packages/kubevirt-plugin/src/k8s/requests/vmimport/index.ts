import { k8sGet, k8sKill } from '@console/internal/module/k8s';
import { getDeletetionTimestamp, getName, getNamespace } from '@console/shared/src';
import { getKubevirtAvailableModel } from '../../../models/kvReferenceForModel';

import { VirtualMachineImportModel, VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types/vm';
import { VMImportKind } from '../../../types/vm-import/ovirt/vm-import';
import { VMWrapper } from '../../wrapper/vm/vm-wrapper';

export const cancelVMImport = async (vmImport: VMImportKind, vmToRemove?: VMKind) => {
  await k8sKill(getKubevirtAvailableModel(VirtualMachineImportModel), vmImport);
  if (vmToRemove) {
    if (new VMWrapper(vmToRemove).getVMImportOwnerReference()) {
      try {
        const deletingVM = await k8sGet(
          VirtualMachineModel,
          getName(vmToRemove),
          getNamespace(vmToRemove),
        );
        if (deletingVM && !getDeletetionTimestamp(deletingVM)) {
          // just lost reference - kill again
          await k8sKill(getKubevirtAvailableModel(VirtualMachineModel), vmToRemove);
        }
      } catch (ignored) {
        // 404 expected
      }
    } else {
      await k8sKill(getKubevirtAvailableModel(VirtualMachineModel), vmToRemove);
    }
  }
};
