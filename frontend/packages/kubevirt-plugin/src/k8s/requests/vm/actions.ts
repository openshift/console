import { coFetch } from '@console/internal/co-fetch';
import { groupVersionFor, k8sKill, k8sPatch, resourceURL } from '@console/internal/module/k8s';
import { getAPIVersion, getName, getNamespace } from '@console/shared/src';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';
import { K8sResourceWithModel } from '../../../types/k8s-resource-with-model';
import { VMKind } from '../../../types/vm';
import { VMImportKind } from '../../../types/vm-import/ovirt/vm-import';
import { PatchBuilder } from '@console/shared/src/k8s';
import { getBootPatch } from '../../patches/vm/vm-boot-patches';
import { cancelVMImport } from '../vmimport';

export enum VMActionType {
  Start = 'start',
  Stop = 'stop',
  Restart = 'restart',
}

const VMActionRequest = async (vm: VMKind, action: VMActionType) => {
  const method = 'PUT';
  let url = resourceURL(
    {
      ...VirtualMachineModel,
      apiVersion: groupVersionFor(getAPIVersion(vm)).version,
      apiGroup: `subresources.${VirtualMachineModel.apiGroup}`,
    },
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

export const VMActionWithBootOrderRequest = async (vm: VMKind, action: VMActionType) => {
  // handle PXE/CDRom boot (kubevirt.ui/firstBoot annotation)
  const bootPatch = getBootPatch(vm);
  if (bootPatch.length > 0) {
    await k8sPatch(getKubevirtAvailableModel(VirtualMachineModel), vm, bootPatch);
  }
  return VMActionRequest(vm, action);
};

export const startVM = async (vm: VMKind) => VMActionWithBootOrderRequest(vm, VMActionType.Start);
export const stopVM = async (vm: VMKind) => VMActionRequest(vm, VMActionType.Stop);
export const restartVM = async (vm: VMKind) =>
  VMActionWithBootOrderRequest(vm, VMActionType.Restart);

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
    await k8sPatch(VirtualMachineModel, vm, [
      new PatchBuilder('/spec/dataVolumeTemplates').remove().build(),
    ]);

    const promises = ownedVolumeResources?.map((ownedVolume) =>
      k8sPatch(DataVolumeModel, ownedVolume?.resource, [
        new PatchBuilder('/metadata/ownerReferences').remove().build(),
      ]),
    );
    await Promise.all(promises);
  }

  if (vmImport && deleteVMImport) {
    await cancelVMImport(vmImport, vm);
  } else {
    await k8sKill(getKubevirtAvailableModel(VirtualMachineModel), vm);
  }
};
