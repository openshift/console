import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants';
import { DUMMY_VM_NAME, ROOT_DISK_NAME } from '../../../../constants/vm';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import {
  AccessMode,
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  VolumeMode,
  VolumeType,
} from '../../../../constants/vm/storage';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { iGetPVCName, iGetPVCNamespace } from '../../../../selectors/immutable/common';
import {
  iGetCommonTemplateDataVolumeSize,
  iGetCommonTemplateDiskBus,
  iGetRelevantTemplate,
} from '../../../../selectors/immutable/template/combined';
import { generateDataVolumeName } from '../../../../utils';
import { iGetIn, toShallowJS } from '../../../../utils/immutable';
import { getEmptyInstallStorage } from '../../../../utils/storage';
import { stringValueUnitSplit } from '../../../form/size-unit-utils';
import {
  getInitialData,
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
} from '../../selectors/immutable/selectors';
import { iGetProvisionSourceStorage } from '../../selectors/immutable/storage';
import {
  iGetProvisionSource,
  iGetRelevantTemplateSelectors,
  iGetVmSettingValue,
} from '../../selectors/immutable/vm-settings';
import { getStorages } from '../../selectors/selectors';
import {
  CommonData,
  VMSettingsField,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../types';
import { InitialStepStateGetter } from './types';

const WINTOOLS_DISK_NAME = 'windows-guest-tools';

const getContainerStorage = (
  bus = DiskBus.VIRTIO,
  size = '15Gi',
  diskType = DiskType.DISK,
  url = '',
  accessMode = undefined,
  volumeMode = undefined,
): VMWizardStorage => {
  const dataVolumeName = generateDataVolumeName(DUMMY_VM_NAME, ROOT_DISK_NAME);
  return {
    type: VMWizardStorageType.PROVISION_SOURCE_DISK,
    disk: new DiskWrapper()
      .init({ name: ROOT_DISK_NAME, bootOrder: 1 })
      .setType(diskType, { bus })
      .asResource(),
    volume: new VolumeWrapper()
      .init({ name: ROOT_DISK_NAME })
      .setType(VolumeType.DATA_VOLUME, { name: dataVolumeName })
      .asResource(),
    dataVolume: new DataVolumeWrapper()
      .init({
        name: dataVolumeName,
        size,
        unit: '',
      })
      .setType(DataVolumeSourceType.REGISTRY, { url })
      .setVolumeMode(VolumeMode.fromString(volumeMode))
      .setAccessModes([AccessMode.fromString(accessMode)])
      .asResource(),
    editConfig: {
      isFieldEditableOverride: {
        source: false,
      },
    },
  };
};

export const windowsToolsStorage = (containerImages: {
  [key: string]: Promise<string> | string;
}) => {
  return {
    type: VMWizardStorageType.WINDOWS_GUEST_TOOLS,
    disk: DiskWrapper.initializeFromSimpleData({
      name: WINTOOLS_DISK_NAME,
      type: DiskType.CDROM,
      bus: DiskBus.SATA,
    }).asResource(),
    volume: VolumeWrapper.initializeFromSimpleData({
      name: WINTOOLS_DISK_NAME,
      type: VolumeType.CONTAINER_DISK,
      typeData: {
        image: (containerImages?.[window.SERVER_FLAGS.branding] || containerImages?.okd) as string,
      },
    }).asResource(),
  };
};

export const getBaseImageStorage = (
  pvcName,
  pvcNamespace,
  pvcSize = '15Gi',
  diskBus: DiskBus,
  accessMode = undefined,
  volumeMode = undefined,
) => {
  const dataVolumeName = generateDataVolumeName(DUMMY_VM_NAME, ROOT_DISK_NAME);
  const [size, unit] = stringValueUnitSplit(pvcSize);

  return {
    type: VMWizardStorageType.PROVISION_SOURCE_DISK,
    disk: DiskWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: DiskType.DISK,
      bus: diskBus || DiskBus.VIRTIO,
      bootOrder: 1,
    }).asResource(),
    volume: VolumeWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: VolumeType.DATA_VOLUME,
      typeData: { name: dataVolumeName },
    }).asResource(),
    dataVolume: new DataVolumeWrapper()
      .init({
        name: dataVolumeName,
        size,
        unit,
      })
      .setType(DataVolumeSourceType.PVC, { name: pvcName, namespace: pvcNamespace })
      .setVolumeMode(VolumeMode.fromString(volumeMode))
      .setAccessModes([AccessMode.fromString(accessMode)])
      .asResource(),
    editConfig: {
      isFieldEditableOverride: {
        source: false,
      },
    },
  };
};

const getUrlStorage = (
  bus = DiskBus.VIRTIO,
  size = '15Gi',
  diskType = DiskType.DISK,
  url = '',
  accessMode = undefined,
  volumeMode = undefined,
): VMWizardStorage => {
  const dataVolumeName = generateDataVolumeName(DUMMY_VM_NAME, ROOT_DISK_NAME);

  return {
    type: VMWizardStorageType.PROVISION_SOURCE_DISK,
    disk: DiskWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: diskType,
      bus,
      bootOrder: 1,
    }).asResource(),
    volume: VolumeWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: VolumeType.DATA_VOLUME,
      typeData: { name: dataVolumeName },
    }).asResource(),
    dataVolume: new DataVolumeWrapper()
      .init({
        name: dataVolumeName,
        size,
        unit: '',
      })
      .setType(DataVolumeSourceType.HTTP, { url })
      .setVolumeMode(VolumeMode.fromString(volumeMode))
      .setAccessModes([AccessMode.fromString(accessMode)])
      .asResource(),
    editConfig: {
      isFieldEditableOverride: {
        source: false,
      },
    },
  };
};

const getPVCStorage = (
  diskType = DiskType.DISK,
  bus = DiskBus.VIRTIO,
  size = '15Gi',
  pvcName = '',
  pvcNamespace = '',
  accessMode = undefined,
  volumeMode = undefined,
): VMWizardStorage => {
  const dataVolumeName = generateDataVolumeName(DUMMY_VM_NAME, ROOT_DISK_NAME);

  return {
    type: VMWizardStorageType.PROVISION_SOURCE_DISK,
    disk: DiskWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: diskType,
      bus,
      bootOrder: 1,
    }).asResource(),
    volume: VolumeWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: VolumeType.DATA_VOLUME,
      typeData: { name: dataVolumeName },
    }).asResource(),
    dataVolume: new DataVolumeWrapper()
      .init({
        name: dataVolumeName,
        size,
        unit: '',
      })
      .setType(DataVolumeSourceType.PVC, { name: pvcName, namespace: pvcNamespace })
      .setVolumeMode(VolumeMode.fromString(volumeMode))
      .setAccessModes([AccessMode.fromString(accessMode)])
      .asResource(),
    editConfig: {
      isFieldEditableOverride: {
        source: false,
      },
    },
  };
};

// Create a new storage source for URL, Container and BaseImage Disk sources
// Depends on OPERATING_SYSTEM CLONE_COMMON_BASE_DISK_IMAGE PROVISION_SOURCE_TYPE FLAVOR USER_TEMPLATE and WORKLOAD_PROFILE
export const getNewProvisionSourceStorage = (state: any, id: string): VMWizardStorage => {
  const provisionSource = iGetProvisionSource(state, id);
  const cloneCommonBaseDiskImage = iGetVmSettingValue(
    state,
    id,
    VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE,
  );

  const isCDRomBootSource = iGetVmSettingValue(state, id, VMSettingsField.IS_CDROM_BOOT_SOURCE);
  const relevantOptions = iGetRelevantTemplateSelectors(state, id);
  const iUserTemplate = iGetCommonData(state, id, VMWizardProps.userTemplate);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);
  const iTemplate = iCommonTemplates && iGetRelevantTemplate(iCommonTemplates, relevantOptions);
  const tmpDiskBus = DiskBus.fromString(
    iGetCommonTemplateDiskBus(iTemplate, VM_TEMPLATE_NAME_PARAMETER),
  );
  const tmpDiskSize = iGetCommonTemplateDataVolumeSize(iTemplate, VM_TEMPLATE_NAME_PARAMETER);
  const initialData = getInitialData(state, id);
  const { source, accessMode, volumeMode } = initialData;
  const storagesUpdate = getStorages(state, id);
  const rootStorage = storagesUpdate.find((s) => s.disk.bootOrder === 1) || storagesUpdate[0];
  const diskBus = tmpDiskBus || new DiskWrapper(rootStorage?.disk).getDiskBus();

  const storageClassConfigMap = toShallowJS(
    iGetLoadedCommonData(state, id, VMWizardProps.storageClassConfigMap),
    undefined,
    true,
  );

  if (provisionSource === ProvisionSource.PXE) {
    return {
      type: VMWizardStorageType.PROVISION_SOURCE_DISK,
      ...getEmptyInstallStorage(storageClassConfigMap),
    };
  }
  if (provisionSource === ProvisionSource.URL) {
    if (source?.url) {
      return getUrlStorage(
        diskBus,
        tmpDiskSize ?? source.size,
        source.cdRom || isCDRomBootSource ? DiskType.CDROM : DiskType.DISK,
        source.url,
        accessMode,
        volumeMode,
      );
    }
    return getUrlStorage(
      diskBus,
      tmpDiskSize ?? source.size,
      isCDRomBootSource ? DiskType.CDROM : undefined,
      undefined,
      accessMode,
      volumeMode,
    );
  }
  if (provisionSource === ProvisionSource.CONTAINER) {
    if (source?.container) {
      return getContainerStorage(
        diskBus,
        tmpDiskSize ?? source.size,
        source.cdRom || isCDRomBootSource ? DiskType.CDROM : DiskType.DISK,
        source.container,
        accessMode,
        volumeMode,
      );
    }
    return getContainerStorage(
      diskBus,
      tmpDiskSize ?? source?.size,
      isCDRomBootSource ? DiskType.CDROM : undefined,
      undefined,
      accessMode,
      volumeMode,
    );
  }
  if (provisionSource === ProvisionSource.DISK && !iUserTemplate && cloneCommonBaseDiskImage) {
    const pvcName = iGetPVCName(iTemplate);
    const pvcNamespace = iGetPVCNamespace(iTemplate);

    const iBaseImage = iGetLoadedCommonData(state, id, VMWizardProps.openshiftCNVBaseImages)
      .valueSeq()
      .find((iPVC) => iGetName(iPVC) === pvcName);
    const pvcSize = iGetIn(iBaseImage, ['spec', `resources`, `requests`, `storage`]);

    return getBaseImageStorage(pvcName, pvcNamespace, pvcSize, diskBus, accessMode, volumeMode);
  }
  if (provisionSource === ProvisionSource.DISK && !iUserTemplate) {
    const iOldSourceStorage = iGetProvisionSourceStorage(state, id);
    const oldSourceStorage: VMWizardStorage = iOldSourceStorage && iOldSourceStorage.toJSON();
    const dataVolumeWrapper =
      oldSourceStorage && oldSourceStorage?.dataVolume
        ? new DataVolumeWrapper(oldSourceStorage.dataVolume)
        : undefined;
    if (dataVolumeWrapper?.getType() === DataVolumeSourceType.PVC) {
      const diskWrapper = new DiskWrapper(oldSourceStorage.disk);
      const size = dataVolumeWrapper.getSize();
      return getPVCStorage(
        diskWrapper.getType(),
        diskWrapper.getDiskBus(),
        `${size.value}${size.unit}`,
        dataVolumeWrapper.getPersistentVolumeClaimName(),
        dataVolumeWrapper.getPersistentVolumeClaimNamespace(),
        dataVolumeWrapper.getAccessModes()?.[0],
        dataVolumeWrapper.getVolumeMode(),
      );
    }
    return getPVCStorage(
      source?.cdRom ? DiskType.CDROM : DiskType.DISK,
      diskBus,
      source?.size,
      source?.pvcName,
      source?.pvcNamespace,
      accessMode,
      volumeMode,
    );
  }
  return null;
};

export const getStorageInitialState: InitialStepStateGetter = (data: CommonData) => ({
  value: [],
  error: null,
  hasAllRequiredFilled: true,
  isValid: true, // empty Storages are valid
  isLocked: false,
  isHidden: data.data.isProviderImport && data.data.isSimpleView,
  isCreateDisabled: false,
  isUpdateDisabled: false,
  isDeleteDisabled: false,
});
