import { apiVersionForModel, TemplateKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared/src';
import { freeOwnedResources } from '../free-owned-resources';
import { K8sResourceWithModel } from '../../../types/k8s-resource-with-model';
import { k8sKillPropagated } from '../k8s-kill-propagated';
import { TemplateModel } from '@console/internal/models';

export const deleteVMTemplate = async (
  vmTemplate: TemplateKind,
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
        name: getName(vmTemplate),
        kind: TemplateModel.kind,
        apiVersion: apiVersionForModel(TemplateModel),
      } as any,
      false,
    );
  }

  await k8sKillPropagated(TemplateModel, vmTemplate);
};
