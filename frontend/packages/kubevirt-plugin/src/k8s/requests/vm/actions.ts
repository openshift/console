import { k8sGet, k8sKill, k8sPatch, resourceURL } from '@console/internal/module/k8s';
import {
  getName,
  getNamespace,
  getOwnerReferences,
  getDeletetionTimestamp,
} from '@console/shared/src';
import { coFetch } from '@console/internal/co-fetch';
import { getPxeBootPatch } from '../../patches/vm/vm-boot-patches';
import { VirtualMachineImportModel, VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types/vm';
import { buildOwnerReferenceForModel } from '../../../utils';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';

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
export const deleteVM = async (vm: VMKind) => {
  const vmImportOwnerReference = (getOwnerReferences(vm) || []).find((reference) =>
    compareOwnerReference(reference, buildOwnerReferenceForModel(VirtualMachineImportModel), true),
  );

  if (vmImportOwnerReference) {
    const namespace = getNamespace(vm);
    await k8sKill(VirtualMachineImportModel, {
      metadata: { name: vmImportOwnerReference.name, namespace },
    });
    try {
      const deletingVM = await k8sGet(VirtualMachineModel, getName(vm), namespace);
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
};
