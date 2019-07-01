import { k8sPatch, resourceURL } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import { coFetch } from '@console/internal/co-fetch';
import { analyticsSvc } from '@console/internal/module/analytics';
import { getPxeBootPatch } from '../../patches/vm/vm-boot-patches';
import { VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types/vm';

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

  if (!response.ok) {
    analyticsSvc.error(`${text}: ${method} ${response.url}`);
  }

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
