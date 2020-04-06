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

const SUPPORTED_NETWORK_TYPES = new Set([NetworkType.POD, NetworkType.MULTUS]);

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
      const diskMapping: DiskMapping = {
        source: { id },
        target: {},
      };
      if (pvcWrapper.getStorageClassName()) {
        diskMapping.target.name = pvcWrapper.getStorageClassName();
      }
      return diskMapping;
    });

const createVMImport = ({
  importProviders,
  vmSettings,
  networks,
  storages,
  namespace,
}: CreateVMParams) => {
  const simpleSettings = asSimpleSettings(vmSettings);
  const vm = getOvirtAttribute(importProviders, OvirtProviderField.VM, 'vm');

  const vmImport = new VMImportWrappper()
    .init({ generateName: 'vm-import-', namespace })
    .setType(VMImportType.OVIRT)
    .setTargetVMName(simpleSettings[VMSettingsField.NAME])
    .setStartVM(simpleSettings[VMSettingsField.START_VM])
    .setCredentialsSecret(
      getOvirtField(importProviders, OvirtProviderField.NEW_OVIRT_ENGINE_SECRET_NAME),
      namespace,
    );

  vmImport
    .getOvirtSourceWrapper()

    .setVM(vm?.id)
    .setNetworkMappings(getNetworkMappings(networks))
    .setDiskMappings(getDiskMappings(storages));

  return vmImport;
};

export const importV2VOvirtVm = async (params: CreateVMParams): Promise<ImporterResult> => {
  const { enhancedK8sMethods } = params;
  const vmImportWrapper = createVMImport(params);

  await enhancedK8sMethods.k8sWrapperCreate(vmImportWrapper);

  return {
    skipVMCreation: true,
  };
};
