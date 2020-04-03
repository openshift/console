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
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { getVolumeCloudInitNoCloud } from '../../../../selectors/vm';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../../wrapper/vm/cloud-init-data-helper';
import { DataVolumeWrapper } from '../../../wrapper/vm/data-volume-wrapper';
import { StorageUISource } from '../../../../components/modals/disk-modal/storage-ui-source';
import { insertName, joinIDs } from '../../../../utils';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
import { CreateVMParams } from './types';

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

const initializeStorage = (params: CreateVMParams, vm: VMWrapper) => {
  const { vmSettings, storages, isTemplate, namespace } = params;
  const settings = asSimpleSettings(vmSettings);

  const resolvedStorages = storages.map((storage) => {
    const { volume, dataVolume, persistentVolumeClaim } = storage;
    const volumeWrapper = new VolumeWrapper(volume, true);
    const dataVolumeWrapper = dataVolume && new DataVolumeWrapper(dataVolume, true);

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
        .setNamespace(isPlainDataVolume ? namespace : undefined);

      if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
        volumeWrapper.appendTypeData({ name: dataVolumeWrapper.getName() });
      }
    }

    return {
      ...storage,
      volume: volumeWrapper.asResource(),
      dataVolume: isPlainDataVolume ? undefined : dataVolumeWrapper?.asResource(),
      dataVolumeToCreate: isPlainDataVolume ? dataVolumeWrapper?.asResource() : undefined,
    };
  });

  vm.setStorages(resolvedStorages);

  return { storages: resolvedStorages };
};

const initializeNetworks = ({ networks, vmSettings }: CreateVMParams, vm: VMWrapper) => {
  vm.setNetworks(networks);
  const hasPodNetwork = networks.some((network) =>
    new NetworkWrapper(network.network).isPodNetwork(),
  );
  if (!hasPodNetwork) {
    vm.setAutoAttachPodInterface(false);
  }
  const pxeNetwork = networks.find((network) =>
    new NetworkInterfaceWrapper(network.networkInterface).isFirstBootableDevice(),
  );
  if (pxeNetwork) {
    const isRunning = getFieldValue(vmSettings, VMSettingsField.START_VM);
    vm.addAnotation(ANNOTATION_PXE_INTERFACE, pxeNetwork.networkInterface.name);
    vm.addAnotation(ANNOTATION_FIRST_BOOT, `${!isRunning}`);
  }
};

export const initializeVM = (params: CreateVMParams, vm: VMWrapper) => {
  const { vmSettings, storages, isTemplate } = params;
  const settings = asSimpleSettings(vmSettings);
  const isRunning = settings[VMSettingsField.START_VM];

  if (settings[VMSettingsField.FLAVOR] === CUSTOM_FLAVOR) {
    vm.setCPU({ sockets: 1, cores: parseInt(settings[VMSettingsField.CPU], 10), threads: 1 });
    vm.setMemory(settings[VMSettingsField.MEMORY]);
  }

  vm.setRunning(!isTemplate && isRunning);

  const cloudInitVolume = storages.map((s) => s.volume).find(getVolumeCloudInitNoCloud);
  const data = new VolumeWrapper(cloudInitVolume).getCloudInitNoCloud();
  vm.setHostname(
    new CloudInitDataHelper(data).get(CloudInitDataFormKeys.HOSTNAME) ||
      settings[VMSettingsField.HOSTNAME] ||
      (isTemplate ? VM_TEMPLATE_NAME_PARAMETER : settings[VMSettingsField.NAME]),
  );

  initializeNetworks(params, vm);
  return initializeStorage(params, vm);
};
