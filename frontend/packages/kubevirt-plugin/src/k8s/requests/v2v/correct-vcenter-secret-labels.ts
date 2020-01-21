import * as _ from 'lodash';
import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { getOwnerReferences } from '@console/shared/src';
import { SecretModel } from '@console/internal/models';
import { PatchBuilder, PatchOperation } from '@console/shared/src/k8s';
import { V2VVMwareModel } from '../../../models';
import { VCENTER_TEMPORARY_LABEL } from '../../../constants/v2v';
import { getLabels } from '../../../selectors/selectors';
import { buildOwnerReferenceForModel } from '../../../utils';

export const correctVCenterSecretLabels = async ({
  secret,
  saveCredentialsRequested,
}: {
  secret: K8sResourceKind;
  saveCredentialsRequested: boolean;
}) => {
  if (secret) {
    const patches = [];

    if (saveCredentialsRequested) {
      patches.push(
        new PatchBuilder(`/metadata/labels`)
          .setObjectRemove(VCENTER_TEMPORARY_LABEL, getLabels(secret))
          .build(),
      );
      const ownerReferences = getOwnerReferences(secret);
      if (ownerReferences) {
        const vmwareReference = buildOwnerReferenceForModel(V2VVMwareModel);
        const filteredOwnerReferences = ownerReferences.filter((ownerReference) =>
          compareOwnerReference(vmwareReference, ownerReference, true),
        );

        if (filteredOwnerReferences.length === ownerReferences.length) {
          patches.push(
            new PatchBuilder(`/metadata/ownerReferences`)
              .setOperation(PatchOperation.REMOVE)
              .build(),
          );
        } else {
          patches.push(
            ...filteredOwnerReferences
              .reverse() // do not cut branches under your own feet
              .map((ownerReference) =>
                new PatchBuilder(`/metadata/ownerReferences`)
                  .setListRemove(ownerReference, ownerReferences)
                  .build(),
              ),
          );
        }
      }
    } else {
      patches.push(
        new PatchBuilder(`/metadata/labels`)
          .setObjectUpdate(VCENTER_TEMPORARY_LABEL, 'true', getLabels(secret))
          .build(),
      );
    }
    const resultPatches = _.compact(patches);
    if (resultPatches.length > 0) {
      return k8sPatch(SecretModel, secret, patches).catch((err) => console.log(err)); // eslint-disable-line no-console
    }
  }
  return null;
};
