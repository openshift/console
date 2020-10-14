import { ConfigMapKind } from '@console/internal/module/k8s';
import {
  CommonData,
  VMWizardStorage,
  VMWizardStorageType,
  VMSettingsField,
  VMWizardProps,
} from '../../types';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import {
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  VolumeType,
} from '../../../../constants/vm/storage';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { WINTOOLS_CONTAINER_NAMES } from '../../../../constants';
import { BinaryUnit, stringValueUnitSplit } from '../../../form/size-unit-utils';
import { InitialStepStateGetter } from './types';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../selectors/config-map/sc-defaults';
import { toShallowJS, iGetIn } from '../../../../utils/immutable';
import { generateDataVolumeName } from '../../../../utils';
import {
  DUMMY_VM_NAME,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
} from '../../../../constants/vm';
import {
  iGetVmSettingValue,
  iGetProvisionSource,
  iGetRelevantTemplateSelectors,
} from '../../selectors/immutable/vm-settings';
import {
  iGetLoadedCommonData,
  iGetName,
  iGetCommonData,
} from '../../selectors/immutable/selectors';
import { iGetRelevantTemplate } from '../../../../selectors/immutable/template/combined';
import { iGetPrameterValue } from '../../../../selectors/immutable/common';

const ROOT_DISK_NAME = 'rootdisk';
const WINTOOLS_DISK_NAME = 'windows-guest-tools';

const containerStorage: VMWizardStorage = {
  type: VMWizardStorageType.PROVISION_SOURCE_DISK,
  disk: DiskWrapper.initializeFromSimpleData({
    name: ROOT_DISK_NAME,
    type: DiskType.DISK,
    bus: DiskBus.VIRTIO,
    bootOrder: 1,
  }).asResource(),
  volume: VolumeWrapper.initializeFromSimpleData({
    name: ROOT_DISK_NAME,
    type: VolumeType.CONTAINER_DISK,
    typeData: { image: '' },
  }).asResource(),
  editConfig: {
    isFieldEditableOverride: {
      source: false,
    },
  },
};

export const windowsToolsStorage: VMWizardStorage = {
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
      image: WINTOOLS_CONTAINER_NAMES[window.SERVER_FLAGS.branding] || WINTOOLS_CONTAINER_NAMES.okd,
    },
  }).asResource(),
};

export const getBaseImageStorage = (
  storageClassConfigMap: ConfigMapKind,
  pvcName,
  pvcNamespace,
  pvcSize = '15Gi',
) => {
  const dataVolumeName = generateDataVolumeName(DUMMY_VM_NAME, ROOT_DISK_NAME);
  const [size, unit] = stringValueUnitSplit(pvcSize);

  return {
    type: VMWizardStorageType.PROVISION_SOURCE_DISK,
    disk: DiskWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: DiskType.DISK,
      bus: DiskBus.VIRTIO,
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

const getUrlStorage = (storageClassConfigMap: ConfigMapKind) => {
  const dataVolumeName = generateDataVolumeName(DUMMY_VM_NAME, ROOT_DISK_NAME);

  return {
    type: VMWizardStorageType.PROVISION_SOURCE_DISK,
    disk: DiskWrapper.initializeFromSimpleData({
      name: ROOT_DISK_NAME,
      type: DiskType.DISK,
      bus: DiskBus.VIRTIO,
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
        size: 15,
        unit: BinaryUnit.Gi,
      })
      .setType(DataVolumeSourceType.HTTP, { url: '' })
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
  const iUserTemplate = iGetCommonData(state, id, VMWizardProps.userTemplate);

  if (provisionSource === ProvisionSource.URL) {
    const iStorageClassConfigMap = iGetLoadedCommonData(
      state,
      id,
      VMWizardProps.storageClassConfigMap,
    );

    return getUrlStorage(toShallowJS(iStorageClassConfigMap, undefined, true));
  }
  if (provisionSource === ProvisionSource.CONTAINER) {
    return containerStorage;
  }
  if (provisionSource === ProvisionSource.DISK && !iUserTemplate && cloneCommonBaseDiskImage) {
    const iStorageClassConfigMap = iGetLoadedCommonData(
      state,
      id,
      VMWizardProps.storageClassConfigMap,
    );

    const relevantOptions = iGetRelevantTemplateSelectors(state, id);
    if (!relevantOptions.os) {
      return null;
    }

    const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);
    const iTemplate = iCommonTemplates && iGetRelevantTemplate(iCommonTemplates, relevantOptions);
    const pvcName = iGetPrameterValue(iTemplate, TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
    const pvcNamespace = iGetPrameterValue(iTemplate, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);

    const iBaseImage = iGetLoadedCommonData(state, id, VMWizardProps.openshiftCNVBaseImages)
      .valueSeq()
      .find((iPVC) => iGetName(iPVC) === pvcName);
    const pvcSize = iGetIn(iBaseImage, ['spec', `resources`, `requests`, `storage`]);

    return getBaseImageStorage(toShallowJS(iStorageClassConfigMap), pvcName, pvcNamespace, pvcSize);
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
