import { coFetch } from '@console/internal/co-fetch';
import { groupVersionFor, k8sKill, resourceURL } from '@console/internal/module/k8s';
import { getAPIVersion, getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../../models';
import {
  getKubevirtAvailableModel,
  getKubevirtModelAvailableAPIVersion,
  kubevirtReferenceForModel,
} from '../../../models/kubevirtReferenceForModel';
import { K8sResourceWithModel } from '../../../types/k8s-resource-with-model';
import { VMIKind } from '../../../types/vm';
import { freeOwnedResources } from '../free-owned-resources';

export enum VMIActionType {
  Unpause = 'unpause',
  Pause = 'pause',
}

const VMIActionRequest = async (vmi: VMIKind, action: VMIActionType) => {
  const method = 'PUT';
  let url = resourceURL(
    {
      ...VirtualMachineInstanceModel,
      apiVersion: groupVersionFor(getAPIVersion(vmi)).version,
      apiGroup: `subresources.${VirtualMachineInstanceModel.apiGroup}`,
    },
    {
      ns: getNamespace(vmi),
      name: getName(vmi),
    },
  );

  url = `${url}/${action}`;

  const response = await coFetch(url, { method });
  const text = await response.text();

  return text;
};

export const unpauseVMI = async (vmi: VMIKind) => VMIActionRequest(vmi, VMIActionType.Unpause);
export const pauseVMI = async (vmi: VMIKind) => VMIActionRequest(vmi, VMIActionType.Pause);

export const deleteVMI = async (
  vmi: VMIKind,
  {
    ownedVolumeResources,
    deleteOwnedVolumeResources,
  }: {
    ownedVolumeResources: K8sResourceWithModel[];
    deleteOwnedVolumeResources: boolean;
  },
) => {
  if (ownedVolumeResources && !deleteOwnedVolumeResources) {
    await freeOwnedResources(
      ownedVolumeResources,
      {
        name: getName(vmi),
        kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
        apiVersion: getKubevirtModelAvailableAPIVersion(VirtualMachineInstanceModel),
      } as any,
      false,
    );
  }

  await k8sKill(getKubevirtAvailableModel(VirtualMachineInstanceModel), vmi);
};
