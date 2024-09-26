import { resourceURL } from '@console/dynamic-plugin-sdk/dist/core/lib/utils/k8s';
import { coFetch } from '@console/internal/co-fetch';
import { groupVersionFor, k8sKill } from '@console/internal/module/k8s';
import { VirtualMachineInstanceModel } from '../../../models';
import {
  getKubevirtAvailableModel,
  getKubevirtModelAvailableAPIVersion,
  kubevirtReferenceForModel,
} from '../../../models/kubevirtReferenceForModel';
import { getAPIVersion, getName, getNamespace } from '../../../selectors/k8sCommon';
import { V1AddVolumeOptions, V1RemoveVolumeOptions } from '../../../types/api';
import { K8sResourceWithModel } from '../../../types/k8s-resource-with-model';
import { VMIKind } from '../../../types/vmi';
import { freeOwnedResources } from '../free-owned-resources';

export enum VMIActionType {
  Unpause = 'unpause',
  Pause = 'pause',
  AddVolume = 'addvolume',
  RemoveVolume = 'removevolume',
}

const VMIActionRequest = async (
  vmi: VMIKind,
  action: VMIActionType,
  body?: V1AddVolumeOptions | V1RemoveVolumeOptions,
) => {
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

  const response = body
    ? await coFetch(url, {
        method,
        body: JSON.stringify(body),
      })
    : await coFetch(url, { method });

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
