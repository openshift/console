/* eslint-disable camelcase, @typescript-eslint/camelcase,no-await-in-loop */
import * as _ from 'lodash';
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { CreateVMParams } from '../../vm/create/types';
import { ImporterResult } from '../../vm/types';
import { VMImportWrappper } from '../../../wrapper/vm-import/vm-import-wrapper';
import { VMImportType } from '../../../../constants/v2v-import/ovirt/vm-import-type';
import { asSimpleSettings } from '../../../../components/create-vm-wizard/selectors/vm-settings';
import {
  OvirtProviderField,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../../../components/create-vm-wizard/types';
import {
  getOvirtAttribute,
  getOvirtField,
} from '../../../../components/create-vm-wizard/selectors/provider/ovirt/selectors';
import { NetworkWrapper } from '../../../wrapper/vm/network-wrapper';
import { NetworkType } from '../../../../constants/vm/network';
import { DiskMapping, NetworkMapping } from '../../../../types/vm-import/ovirt/vm-import';
import { PersistentVolumeClaimWrapper } from '../../../wrapper/vm/persistent-volume-claim-wrapper';
import { SecretWrappper } from '../../../wrapper/k8s/secret-wrapper';
import { buildOwnerReference } from '../../../../utils';
import { VM_IMPORT_PROPAGATE_ANNOTATIONS_ANNOTATION } from '../../../../constants/v2v-import/constants';
import { ANNOTATION_DESCRIPTION } from '../../../../constants/vm';

const SUPPORTED_NETWORK_TYPES = new Set([NetworkType.POD, NetworkType.MULTUS]);

const createSecret = async ({
  vmSettings,
  importProviders,
  namespace,
  enhancedK8sMethods,
}: CreateVMParams) => {
  const simpleSettings = asSimpleSettings(vmSettings);
  const targetVMName = simpleSettings[VMSettingsField.NAME];
  const sourceSecretName = getOvirtField(
    importProviders,
    OvirtProviderField.CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME,
  );

  const sourceSecretWrapper = new SecretWrappper(
    await enhancedK8sMethods.k8sGet(SecretModel, sourceSecretName, namespace, null, {
      disableHistory: true,
    }),
  );

  return enhancedK8sMethods.k8sWrapperCreate(
    new SecretWrappper()
      .init({
        generateName: `vm-import-${targetVMName}-`,
        namespace,
      })
      .setData(sourceSecretWrapper.getData()),
  );
};

const getNetworkMappings = (networks: VMWizardNetwork[]) => {
  const networksToMap = _.uniqBy(
    networks.filter(
      ({ network, importData }) =>
        SUPPORTED_NETWORK_TYPES.has(new NetworkWrapper(network).getType()) && importData?.vnicID,
    ),
    (wizardNetwork) => wizardNetwork.importData?.vnicID, // should be mapped 1 to 1 - UI makes sure it duplicates contain the same network (type and data)
  );

  return networksToMap.map(({ network, importData: { vnicID } }) => {
    const networkWrapper = new NetworkWrapper(network);
    const nicMapping: NetworkMapping = {
      source: { id: vnicID },
      type: networkWrapper.getType().getValue(),
    };
    if (networkWrapper.getType() === NetworkType.MULTUS) {
      nicMapping.target = { name: networkWrapper.getMultusNetworkName() };
    }
    return nicMapping;
  });
};

const getDiskMappings = (storage: VMWizardStorage[]) =>
  storage
    .filter(({ type, importData }) => type === VMWizardStorageType.V2V_OVIRT_IMPORT && importData)
    .map(({ persistentVolumeClaim, importData: { id } }) => {
      const persistentVolumeClaimWrapper = new PersistentVolumeClaimWrapper(persistentVolumeClaim);

      return {
        source: { id },
        target: {
          name: persistentVolumeClaimWrapper.getStorageClassName() || '',
        },
        volumeMode: persistentVolumeClaimWrapper.getVolumeMode() || null,
      } as DiskMapping;
    });

const createVMImport = async (
  {
    importProviders,
    vmSettings,
    networks,
    storages,
    namespace,
    enhancedK8sMethods,
  }: CreateVMParams,
  { secret }: { secret: SecretKind },
) => {
  const simpleSettings = asSimpleSettings(vmSettings);
  const targetVMName = simpleSettings[VMSettingsField.NAME];
  const description = simpleSettings[VMSettingsField.DESCRIPTION];
  const vm = getOvirtAttribute(importProviders, OvirtProviderField.VM, 'vm');
  const vmAnnotations = {};

  if (description) {
    vmAnnotations[ANNOTATION_DESCRIPTION] = description;
  }

  const vmImport = new VMImportWrappper()
    .init({ generateName: `vm-import-${targetVMName}-`, namespace })
    .setType(VMImportType.OVIRT)
    .setTargetVMName(targetVMName)
    .setStartVM(simpleSettings[VMSettingsField.START_VM])
    .setCredentialsSecret(
      getOvirtField(importProviders, OvirtProviderField.CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME),
      namespace,
    );

  if (!_.isEmpty(vmAnnotations)) {
    vmImport.addAnotation(
      VM_IMPORT_PROPAGATE_ANNOTATIONS_ANNOTATION,
      JSON.stringify(vmAnnotations),
    );
  }

  vmImport
    .getOvirtSourceWrapper()

    .setVM(vm?.id)
    .setNetworkMappings(getNetworkMappings(networks))
    .setDiskMappings(getDiskMappings(storages));

  const vmImportResult = await enhancedK8sMethods.k8sWrapperCreate(vmImport);
  const vmImportOwnerReference = buildOwnerReference(vmImportResult);

  const secretWrapper = new SecretWrappper(secret);

  await enhancedK8sMethods.k8sWrapperPatch(secretWrapper, [
    new PatchBuilder('/metadata/ownerReferences')
      .setListUpdate(
        vmImportOwnerReference,
        secretWrapper.getOwnerReferences(),
        compareOwnerReference,
      )
      .build(),
  ]);

  return vmImportResult;
};

export const importV2VOvirtVm = async (params: CreateVMParams): Promise<ImporterResult> => {
  const secret = await createSecret(params);
  await createVMImport(params, { secret });

  return {
    skipVMCreation: true,
  };
};
