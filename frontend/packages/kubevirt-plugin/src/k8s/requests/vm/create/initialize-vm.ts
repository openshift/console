import {
  asSimpleSettings,
  getFieldValue,
} from '../../../../components/create-vm-wizard/selectors/vm-settings';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import {
  ANNOTATION_FIRST_BOOT,
  ANNOTATION_PXE_INTERFACE,
  VolumeType,
} from '../../../../constants/vm';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates/constants';
import { isCustomFlavor } from '../../../../selectors/vm-like/flavor';
import { getVolumeCloudInitNoCloud } from '../../../../selectors/vm/volume';
import { resolveDataVolumeName } from '../../../../utils';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../../wrapper/vm/cloud-init-data-helper';
import { DataVolumeWrapper } from '../../../wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../wrapper/vm/disk-wrapper';
import { NetworkInterfaceWrapper } from '../../../wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../wrapper/vm/network-wrapper';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import { CreateVMParams } from './types';

const initializeStorage = (params: CreateVMParams, vm: VMWrapper) => {
  const { vmSettings, storages, isTemplate } = params;
  const settings = asSimpleSettings(vmSettings);

  const resolvedStorages = storages.map((storage) => {
    const { disk, volume, dataVolume } = storage;
    const volumeWrapper = new VolumeWrapper(volume, true);
    const dataVolumeWrapper = dataVolume && new DataVolumeWrapper(dataVolume, true);

    if (dataVolumeWrapper) {
      dataVolumeWrapper.setName(
        resolveDataVolumeName({
          diskName: new DiskWrapper(disk).getName(),
          vmLikeEntityName: settings[VMSettingsField.NAME],
          isTemplate,
        }),
      );

      if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
        volumeWrapper.appendTypeData({ name: dataVolumeWrapper.getName() });
      }
    }

    if (volumeWrapper.getCloudInitNoCloud()) {
      volumeWrapper.setCloudInitNoCloud({
        userData: ['#cloud-config', volumeWrapper.getCloudInitNoCloud().userData].join('\n'),
      });
    }

    return {
      ...storage,
      volume: volumeWrapper.asResource(),
      dataVolume: dataVolumeWrapper?.asResource(),
    };
  });

  vm.setWizardStorages(resolvedStorages);

  return { storages: resolvedStorages };
};

const initializeNetworks = ({ networks, vmSettings }: CreateVMParams, vm: VMWrapper) => {
  vm.setWizardNetworks(networks);
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

  if (isCustomFlavor(settings[VMSettingsField.FLAVOR])) {
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
