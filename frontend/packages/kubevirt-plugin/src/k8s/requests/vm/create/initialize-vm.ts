import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import {
  asSimpleSettings,
  getFieldValue,
} from '../../../../components/create-vm-wizard/selectors/vm-settings';
import {
  ANNOTATION_FIRST_BOOT,
  ANNOTATION_PXE_INTERFACE,
  CUSTOM_FLAVOR,
  DataVolumeSourceType,
  VolumeType,
} from '../../../../constants/vm';
import { NetworkWrapper } from '../../../wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../wrapper/vm/network-interface-wrapper';
import { MutableVMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { getVolumeCloudInitNoCloud } from '../../../../selectors/vm';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../../wrapper/vm/cloud-init-data-helper';
import { DataVolumeWrapper } from '../../../wrapper/vm/data-volume-wrapper';
import { StorageUISource } from '../../../../components/modals/disk-modal/storage-ui-source';
import { insertName, joinIDs } from '../../../../utils';
import {
  getDefaultSCAccessMode,
  getDefaultSCVolumeMode,
} from '../../../../selectors/config-map/sc-defaults';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
import { CreateVMEnhancedParams } from './types';

const initializeStorage = (params: CreateVMEnhancedParams, vm: MutableVMWrapper) => {
  const { vmSettings, storages, isTemplate, storageClassConfigMap, namespace } = params;
  const settings = asSimpleSettings(vmSettings);

  const resolvedStorages = storages.map((storage) => {
    const { volume, dataVolume, persistentVolumeClaim } = storage;
    const volumeWrapper = VolumeWrapper.initialize(volume);
    const dataVolumeWrapper = dataVolume && DataVolumeWrapper.initialize(dataVolume);

    const source = StorageUISource.fromTypes(
      volumeWrapper.getType(),
      dataVolumeWrapper && dataVolumeWrapper.getType(),
      !!persistentVolumeClaim,
    );
    const isPlainDataVolume = source && source.isPlainDataVolume(isTemplate);

    let finalDataVolumeWrapper;
    if (dataVolumeWrapper) {
      let finalDataVolumeName = insertName(
        dataVolumeWrapper.getName(),
        !isTemplate || isPlainDataVolume
          ? settings[VMSettingsField.NAME]
          : VM_TEMPLATE_NAME_PARAMETER,
      );

      if (
        dataVolumeWrapper.getType() === DataVolumeSourceType.PVC &&
        finalDataVolumeName === dataVolumeWrapper.getPesistentVolumeClaimName()
      ) {
        finalDataVolumeName = joinIDs(finalDataVolumeName, 'clone');
      }

      finalDataVolumeWrapper = DataVolumeWrapper.mergeWrappers(
        dataVolumeWrapper,
        DataVolumeWrapper.initializeFromSimpleData({
          name: finalDataVolumeName,
          namespace: isPlainDataVolume ? namespace : undefined,
          accessModes: dataVolumeWrapper.getAccessModes() || [
            getDefaultSCAccessMode(storageClassConfigMap, dataVolumeWrapper.getStorageClassName()),
          ],
          volumeMode:
            dataVolumeWrapper.getVolumeMode() ||
            getDefaultSCVolumeMode(storageClassConfigMap, dataVolumeWrapper.getStorageClassName()),
        }),
      );
    }

    return {
      ...storage,
      volume:
        finalDataVolumeWrapper && volumeWrapper.getType() === VolumeType.DATA_VOLUME
          ? VolumeWrapper.mergeWrappers(
              volumeWrapper,
              VolumeWrapper.initializeFromSimpleData({
                type: VolumeType.DATA_VOLUME,
                typeData: { name: finalDataVolumeWrapper.getName() },
              }),
            ).asResource()
          : volume,
      dataVolume:
        !finalDataVolumeWrapper || isPlainDataVolume
          ? undefined
          : finalDataVolumeWrapper.asResource(),
      dataVolumeToCreate:
        finalDataVolumeWrapper && isPlainDataVolume
          ? finalDataVolumeWrapper.asResource()
          : undefined,
    };
  });

  vm.setStorages(resolvedStorages);

  return { storages: resolvedStorages };
};

const initializeNetworks = (
  { networks, vmSettings }: CreateVMEnhancedParams,
  vm: MutableVMWrapper,
) => {
  vm.setNetworks(networks);
  const hasPodNetwork = networks.some((network) =>
    NetworkWrapper.initialize(network.network).isPodNetwork(),
  );
  if (!hasPodNetwork) {
    vm.setAutoAttachPodInterface(false);
  }
  const pxeNetwork = networks.find((network) =>
    NetworkInterfaceWrapper.initialize(network.networkInterface).isFirstBootableDevice(),
  );
  if (pxeNetwork) {
    const isRunning = getFieldValue(vmSettings, VMSettingsField.START_VM);
    vm.addAnotation(ANNOTATION_PXE_INTERFACE, pxeNetwork.networkInterface.name);
    vm.addAnotation(ANNOTATION_FIRST_BOOT, `${!isRunning}`);
  }
};

export const initializeVM = (params: CreateVMEnhancedParams, vm: MutableVMWrapper) => {
  const { vmSettings, storages, isTemplate } = params;
  const settings = asSimpleSettings(vmSettings);
  const isRunning = settings[VMSettingsField.START_VM];

  if (settings[VMSettingsField.FLAVOR] === CUSTOM_FLAVOR) {
    vm.setCPU(settings[VMSettingsField.CPU]);
    vm.setMemory(settings[VMSettingsField.MEMORY]);
  }

  vm.setRunning(!isTemplate && isRunning);

  const cloudInitVolume = storages.map((s) => s.volume).find(getVolumeCloudInitNoCloud);
  const data = VolumeWrapper.initialize(cloudInitVolume).getCloudInitNoCloud();
  vm.setHostname(
    new CloudInitDataHelper(data).get(CloudInitDataFormKeys.HOSTNAME) ||
      settings[VMSettingsField.HOSTNAME] ||
      (isTemplate ? VM_TEMPLATE_NAME_PARAMETER : settings[VMSettingsField.NAME]),
  );

  initializeNetworks(params, vm);
  return initializeStorage(params, vm);
};
