/* eslint-disable camelcase, @typescript-eslint/camelcase,no-await-in-loop */
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
import { SecretModel } from '@console/internal/models';
import { SecretWrappper } from '../../../wrapper/k8s/secret-wrapper';
import { SecretKind } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { buildOwnerReference } from '../../../../utils';

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

const getNetworkMappings = (networks: VMWizardNetwork[]) =>
  networks
    .filter(
      ({ network, importData }) =>
        SUPPORTED_NETWORK_TYPES.has(new NetworkWrapper(network).getType()) && importData,
    )
    .map(({ network, importData: { id } }) => {
      const networkWrapper = new NetworkWrapper(network);
      const nicMapping: NetworkMapping = {
        source: { id },
        type: networkWrapper.getType().getValue(),
      };
      if (networkWrapper.getType() === NetworkType.MULTUS) {
        nicMapping.target = { name: networkWrapper.getMultusNetworkName() };
      }
      return nicMapping;
    });

const getDiskMappings = (storage: VMWizardStorage[]) =>
  storage
    .filter(({ type, importData }) => type === VMWizardStorageType.V2V_OVIRT_IMPORT && importData)
    .map(({ persistentVolumeClaim, importData: { id } }) => {
      const pvcWrapper = new PersistentVolumeClaimWrapper(persistentVolumeClaim);
      return pvcWrapper.getStorageClassName()
        ? ({
            source: { id },
            target: {
              name: pvcWrapper.getStorageClassName(),
            },
          } as DiskMapping)
        : null;
    })
    .filter((m) => m);

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
  const vm = getOvirtAttribute(importProviders, OvirtProviderField.VM, 'vm');

  const vmImport = new VMImportWrappper()
    .init({ generateName: `vm-import-${targetVMName}-`, namespace })
    .setType(VMImportType.OVIRT)
    .setTargetVMName(targetVMName)
    .setStartVM(simpleSettings[VMSettingsField.START_VM])
    .setCredentialsSecret(
      getOvirtField(importProviders, OvirtProviderField.CURRENT_RESOLVED_OVIRT_ENGINE_SECRET_NAME),
      namespace,
    );

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
