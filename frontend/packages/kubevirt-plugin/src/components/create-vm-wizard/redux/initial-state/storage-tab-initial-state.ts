import { ConfigMapKind } from '@console/internal/module/k8s';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants';
import {
  DUMMY_VM_NAME,
  ROOT_DISK_NAME,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
} from '../../../../constants/vm';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import {
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  VolumeType,
} from '../../../../constants/vm/storage';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../selectors/config-map/sc-defaults';
import { iGetPrameterValue } from '../../../../selectors/immutable/common';
import {
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
  storageClassConfigMap: ConfigMapKind,
  bus = DiskBus.VIRTIO,
  size = '15Gi',
  diskType = DiskType.DISK,
  url = '',
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
      .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap))
      .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap))
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
  storageClassConfigMap: ConfigMapKind,
  pvcName,
  pvcNamespace,
  pvcSize = '15Gi',
  diskBus: DiskBus,
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
      .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap))
      .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap))
      .asResource(),
    editConfig: {
      isFieldEditableOverride: {
        source: false,
      },
    },
  };
};

const getUrlStorage = (
  storageClassConfigMap: ConfigMapKind,
  bus = DiskBus.VIRTIO,
  size = '15Gi',
  diskType = DiskType.DISK,
  url = '',
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
      .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap))
      .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap))
      .asResource(),
    editConfig: {
      isFieldEditableOverride: {
        source: false,
      },
    },
  };
};

const getPVCStorage = (
  storageClassConfigMap: ConfigMapKind,
  diskType = DiskType.DISK,
  bus = DiskBus.VIRTIO,
  size = '15Gi',
  pvcName = '',
  pvcNamespace = '',
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
      .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap))
      .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap))
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

  const relevantOptions = iGetRelevantTemplateSelectors(state, id);
  const iUserTemplate = iGetCommonData(state, id, VMWizardProps.userTemplate);
  const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);
  const iTemplate = iCommonTemplates && iGetRelevantTemplate(iCommonTemplates, relevantOptions);
  const tmpDiskBus = DiskBus.fromString(
    iGetCommonTemplateDiskBus(iTemplate, VM_TEMPLATE_NAME_PARAMETER),
  );
  const initialData = getInitialData(state, id);
  const { source } = initialData;
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
        storageClassConfigMap,
        diskBus,
        source.size,
        source.cdRom ? DiskType.CDROM : DiskType.DISK,
        source.url,
      );
    }
    return getUrlStorage(storageClassConfigMap, diskBus, source?.size);
  }
  if (provisionSource === ProvisionSource.CONTAINER) {
    if (source?.container) {
      return getContainerStorage(
        storageClassConfigMap,
        diskBus,
        source.size,
        source.cdRom ? DiskType.CDROM : DiskType.DISK,
        source.container,
      );
    }
    return getContainerStorage(storageClassConfigMap, diskBus, source?.size);
  }
  if (provisionSource === ProvisionSource.DISK && !iUserTemplate && cloneCommonBaseDiskImage) {
    const iStorageClassConfigMap = iGetLoadedCommonData(
      state,
      id,
      VMWizardProps.storageClassConfigMap,
    );

    const pvcName = iGetPrameterValue(iTemplate, TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
    const pvcNamespace = iGetPrameterValue(iTemplate, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);

    const iBaseImage = iGetLoadedCommonData(state, id, VMWizardProps.openshiftCNVBaseImages)
      .valueSeq()
      .find((iPVC) => iGetName(iPVC) === pvcName);
    const pvcSize = iGetIn(iBaseImage, ['spec', `resources`, `requests`, `storage`]);

    return getBaseImageStorage(
      toShallowJS(iStorageClassConfigMap),
      pvcName,
      pvcNamespace,
      pvcSize,
      diskBus,
    );
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
        storageClassConfigMap,
        diskWrapper.getType(),
        diskWrapper.getDiskBus(),
        `${size.value}${size.unit}`,
        dataVolumeWrapper.getPersistentVolumeClaimName(),
        dataVolumeWrapper.getPersistentVolumeClaimNamespace(),
      );
    }
    return getPVCStorage(
      storageClassConfigMap,
      source?.cdRom ? DiskType.CDROM : DiskType.DISK,
      diskBus,
      source?.size,
      source?.pvcName,
      source?.pvcNamespace,
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
