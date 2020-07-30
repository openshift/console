import { ConfigMapKind } from '@console/internal/module/k8s';
import { CommonData, VMWizardStorage, VMWizardStorageType, VMWizardProps } from '../../types';
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
import { BinaryUnit } from '../../../form/size-unit-utils';
import { WINTOOLS_CONTAINER_NAMES } from '../../../../constants';
import { InitialStepStateGetter } from './types';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../selectors/config-map/sc-defaults';
import { toShallowJS } from '../../../../utils/immutable';
import { generateDataVolumeName } from '../../../../utils';
import { DUMMY_VM_NAME } from '../../../../constants/vm';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { iGetLoadedCommonData } from '../../selectors/immutable/selectors';

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
        size: 10,
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

export const getNewProvisionSourceStorage = (state: any, id: string): VMWizardStorage => {
  const provisionSource = iGetProvisionSource(state, id);

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
