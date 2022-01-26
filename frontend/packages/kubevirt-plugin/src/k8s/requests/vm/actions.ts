import { coFetch } from '@console/internal/co-fetch';
import { groupVersionFor, k8sKill, k8sPatch, resourceURL } from '@console/internal/module/k8s';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';
import { getAPIVersion, getName, getNamespace } from '../../../selectors';
import { V1AddVolumeOptions, V1RemoveVolumeOptions } from '../../../types/api';
import { V1DeleteOptions } from '../../../types/api/V1DeleteOptions';
import { V1StopOptions } from '../../../types/api/V1StopOptions';
import { K8sResourceWithModel } from '../../../types/k8s-resource-with-model';
import { VMKind } from '../../../types/vm';
import { VMImportKind } from '../../../types/vm-import/ovirt/vm-import';
import { PatchBuilder } from '../../helpers/patch';
import { getBootPatch } from '../../patches/vm/vm-boot-patches';
import { cancelVMImport } from '../vmimport';

export enum VMActionType {
  Start = 'start',
  Stop = 'stop',
  Restart = 'restart',
  AddVolume = 'addvolume',
  RemoveVolume = 'removevolume',
}

const VMActionRequest = async (
  vm: VMKind,
  action: VMActionType,
  body?: V1AddVolumeOptions | V1RemoveVolumeOptions | V1StopOptions,
) => {
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

  const response = body
    ? await coFetch(url, {
        method,
        body: JSON.stringify(body),
      })
    : await coFetch(url, { method });
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
export const stopVM = async (vm: VMKind, stopOptions?: V1StopOptions) =>
  VMActionRequest(vm, VMActionType.Stop, stopOptions);
export const restartVM = async (vm: VMKind) =>
  VMActionWithBootOrderRequest(vm, VMActionType.Restart);
export const addHotplugPersistent = async (vm: VMKind, body: V1AddVolumeOptions) =>
  VMActionRequest(vm, VMActionType.AddVolume, body);
export const removeHotplugPersistent = async (vm: VMKind, body: V1RemoveVolumeOptions) =>
  VMActionRequest(vm, VMActionType.RemoveVolume, body);

export const deleteVM = async (
  vm: VMKind,
  {
    vmImport,
    deleteVMImport,
    ownedVolumeResources,
    deleteOwnedVolumeResources,
    deleteOptions,
  }: {
    vmImport: VMImportKind;
    deleteVMImport: boolean;
    ownedVolumeResources: K8sResourceWithModel[];
    deleteOwnedVolumeResources: boolean;
    deleteOptions: V1DeleteOptions;
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
    await cancelVMImport(vmImport, vm, deleteOptions);
  } else {
    await k8sKill(getKubevirtAvailableModel(VirtualMachineModel), vm, null, null, deleteOptions);
  }
};
