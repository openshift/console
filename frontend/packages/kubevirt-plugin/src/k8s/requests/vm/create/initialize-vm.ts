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
import { MutableVolumeWrapper, VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../../wrapper/vm/cloud-init-data-helper';
import {
  DataVolumeWrapper,
  MutableDataVolumeWrapper,
} from '../../../wrapper/vm/data-volume-wrapper';
import { StorageUISource } from '../../../../components/modals/disk-modal/storage-ui-source';
import { insertName, joinIDs } from '../../../../utils';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../selectors/config-map/sc-defaults';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
import { CreateVMEnhancedParams } from './types';

const resolveDataVolumeName = (
  dataVolumeWrapper: DataVolumeWrapper,
  {
    newName,
    isTemplate,
    isPlainDataVolume,
  }: { newName: string; isTemplate: boolean; isPlainDataVolume: boolean },
) => {
  const finalName = insertName(
    dataVolumeWrapper.getName(),
    !isTemplate || isPlainDataVolume ? newName : VM_TEMPLATE_NAME_PARAMETER,
  );
  return dataVolumeWrapper.getType() === DataVolumeSourceType.PVC &&
    finalName === dataVolumeWrapper.getPesistentVolumeClaimName()
    ? joinIDs(finalName, 'clone')
    : finalName;
};

const initializeStorage = (params: CreateVMEnhancedParams, vm: MutableVMWrapper) => {
  const { vmSettings, storages, isTemplate, storageClassConfigMap, namespace } = params;
  const settings = asSimpleSettings(vmSettings);

  const resolvedStorages = storages.map((storage) => {
    const { volume, dataVolume, persistentVolumeClaim } = storage;
    const volumeWrapper = new MutableVolumeWrapper(volume, true);
    const dataVolumeWrapper = dataVolume && new MutableDataVolumeWrapper(dataVolume, true);

    const source = StorageUISource.fromTypes(
      volumeWrapper.getType(),
      dataVolumeWrapper && dataVolumeWrapper.getType(),
      !!persistentVolumeClaim,
    );
    const isPlainDataVolume = source.isPlainDataVolume(isTemplate);

    if (dataVolumeWrapper) {
      dataVolumeWrapper
        .setName(
          resolveDataVolumeName(dataVolumeWrapper, {
            newName: settings[VMSettingsField.NAME],
            isTemplate,
            isPlainDataVolume,
          }),
        )
        .setNamespace(isPlainDataVolume ? namespace : undefined)
        .assertDefaultModes(
          getDefaultSCVolumeMode(storageClassConfigMap, dataVolumeWrapper.getStorageClassName()),
          getDefaultSCAccessModes(storageClassConfigMap, dataVolumeWrapper.getStorageClassName()),
        );

      if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
        volumeWrapper.appendTypeData({ name: dataVolumeWrapper.getName() });
      }
    }

    return {
      ...storage,
      volume: volumeWrapper.asMutableResource(),
      dataVolume: isPlainDataVolume ? undefined : dataVolumeWrapper?.asMutableResource(),
      dataVolumeToCreate: isPlainDataVolume ? dataVolumeWrapper?.asMutableResource() : undefined,
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
