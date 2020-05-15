import {
  apiVersionForModel,
  k8sGet,
  k8sKill,
  k8sPatch,
  resourceURL,
} from '@console/internal/module/k8s';
import { getName, getNamespace, getDeletetionTimestamp } from '@console/shared/src';
import { coFetch } from '@console/internal/co-fetch';
import { getPxeBootPatch } from '../../patches/vm/vm-boot-patches';
import { VirtualMachineImportModel, VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types/vm';
import { VMWrapper } from '../../wrapper/vm/vm-wrapper';
import { freeOwnedResources } from '../free-owned-resources';
import { VMImportKind } from '../../../types/vm-import/ovirt/vm-import';
import { K8sResourceWithModel } from '../../../types/k8s-resource-with-model';

export enum VMActionType {
  Start = 'start',
  Stop = 'stop',
  Restart = 'restart',
}

const VMActionRequest = async (vm: VMKind, action: VMActionType) => {
  const method = 'PUT';
  let url = resourceURL(
    { ...VirtualMachineModel, apiGroup: `subresources.${VirtualMachineModel.apiGroup}` },
    {
      ns: getNamespace(vm),
      name: getName(vm),
    },
  );

  url = `${url}/${action}`;

  const response = await coFetch(url, { method });
  const text = await response.text();

  return text;
};

export const VMActionWithPXERequest = async (vm: VMKind, action: VMActionType) => {
  // handle PXE boot (kubevirt.ui/firstBoot annotation)
  const pxePatch = getPxeBootPatch(vm);
  if (pxePatch.length > 0) {
    await k8sPatch(VirtualMachineModel, vm, pxePatch);
  }
  return VMActionRequest(vm, action);
};

export const startVM = async (vm: VMKind) => VMActionWithPXERequest(vm, VMActionType.Start);
export const stopVM = async (vm: VMKind) => VMActionRequest(vm, VMActionType.Stop);
export const restartVM = async (vm: VMKind) => VMActionWithPXERequest(vm, VMActionType.Restart);

export const deleteVM = async (
  vm: VMKind,
  {
    vmImport,
    deleteVMImport,
    ownedVolumeResources,
    deleteOwnedVolumeResources,
  }: {
    vmImport: VMImportKind;
    deleteVMImport: boolean;
    ownedVolumeResources: K8sResourceWithModel[];
    deleteOwnedVolumeResources: boolean;
  },
) => {
  if (ownedVolumeResources && !deleteOwnedVolumeResources) {
    await freeOwnedResources(
      ownedVolumeResources,
      {
        name: getName(vm),
        kind: VirtualMachineModel.kind,
        apiVersion: apiVersionForModel(VirtualMachineModel),
      } as any,
      false,
    );
  }

  if (vmImport && deleteVMImport) {
    await k8sKill(VirtualMachineImportModel, vmImport);
    if (new VMWrapper(vm).getVMImportOwnerReference()) {
      try {
        const deletingVM = await k8sGet(VirtualMachineModel, getName(vm), getNamespace(vm));
        if (deletingVM && !getDeletetionTimestamp(deletingVM)) {
          // just lost reference - kill again
          await k8sKill(VirtualMachineModel, vm);
        }
      } catch (ignored) {
        // 404 expected
      }
    } else {
      await k8sKill(VirtualMachineModel, vm);
    }
  } else {
    await k8sKill(VirtualMachineModel, vm);
  }
};
