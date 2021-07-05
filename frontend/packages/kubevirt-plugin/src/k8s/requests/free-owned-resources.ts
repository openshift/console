import { getOwnerReferences } from '@console/dynamic-plugin-sdk/src/shared';
import { PatchBuilder } from '@console/dynamic-plugin-sdk/src/shared/k8s';
import { compareOwnerReference } from '@console/dynamic-plugin-sdk/src/shared/utils/owner-references';
import { k8sKill, k8sPatch, OwnerReference } from '@console/internal/module/k8s';
import { K8sResourceWithModel } from '../../types/k8s-resource-with-model';

export const freeOwnedResources = async (
  ownedResources: K8sResourceWithModel[],
  owner: OwnerReference,
  doDelete: boolean,
) => {
  const freePromises = (ownedResources || [])
    .filter((res) => res)
    .map(({ model, resource: ownedResource }) => {
      if (doDelete) {
        return k8sKill(model, ownedResource);
      }
      return k8sPatch(model, ownedResource, [
        new PatchBuilder('/metadata/ownerReferences')
          .setListRemove(getOwnerReferences(ownedResource), (ownerReference) =>
            compareOwnerReference(ownerReference, owner),
          )
          .build(),
      ]);
    });

  return Promise.all(freePromises);
};
