import { k8sKill, k8sPatch, OwnerReference } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import { getOwnerReferences } from '@console/shared/src';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
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
