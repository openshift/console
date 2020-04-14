import * as _ from 'lodash';
import { k8sGet, k8sPatch, SecretKind } from '@console/internal/module/k8s';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { getLabels, getOwnerReferences } from '@console/shared/src';
import { SecretModel } from '@console/internal/models';
import { PatchBuilder } from '@console/shared/src/k8s';
import { V2V_TEMPORARY_LABEL } from '../../../constants/v2v';
import { buildOwnerReferenceForModel } from '../../../utils';
import { VMImportProvider } from '../../../components/create-vm-wizard/types';
import { OVirtProviderModel, V2VVMwareModel } from '../../../models';

export const correctVMImportProviderSecretLabels = async ({
  secretName,
  secretNamespace,
  saveCredentialsRequested,
  provider,
}: {
  secretName: string;
  secretNamespace: string;
  saveCredentialsRequested: boolean;
  provider: VMImportProvider;
}) => {
  if (!secretName || !secretNamespace) {
    return null;
  }

  const secret: SecretKind = await k8sGet(SecretModel, secretName, secretNamespace);

  const patches = [];

  if (saveCredentialsRequested) {
    patches.push(
      new PatchBuilder('/metadata/labels')
        .setObjectRemove(V2V_TEMPORARY_LABEL, getLabels(secret))
        .build(),
    );
    const ownerReferences = getOwnerReferences(secret);
    if (ownerReferences) {
      const providerCRReference = buildOwnerReferenceForModel(
        provider === VMImportProvider.OVIRT ? OVirtProviderModel : V2VVMwareModel,
      );
      const filteredOwnerReferences = ownerReferences.filter((ownerReference) =>
        compareOwnerReference(providerCRReference, ownerReference, true),
      );

      if (filteredOwnerReferences.length === ownerReferences.length) {
        patches.push(new PatchBuilder('/metadata/ownerReferences').remove().build());
      } else {
        patches.push(
          ...filteredOwnerReferences
            .reverse() // do not cut branches under your own feet
            .map((ownerReference) =>
              new PatchBuilder('/metadata/ownerReferences')
                .setListRemove(ownerReferences, (item) => item === ownerReference)
                .build(),
            ),
        );
      }
    }
  } else {
    patches.push(
      new PatchBuilder('/metadata/labels')
        .setObjectUpdate(V2V_TEMPORARY_LABEL, 'true', getLabels(secret))
        .build(),
    );
  }
  const resultPatches = _.compact(patches);
  if (resultPatches.length > 0) {
    return k8sPatch(SecretModel, secret, patches).catch((err) => console.log(err)); // eslint-disable-line no-console
  }
  return null;
};
