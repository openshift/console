import { ConfigMapKind } from '@console/internal/module/k8s';
import { CommonData, VMWizardStorage, VMWizardStorageType } from '../../types';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import {
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  VolumeType,
} from '../../../../constants/vm/storage';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { prefixedID } from '../../../../utils';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
import { BinaryUnit } from '../../../form/size-unit-utils';
import { WINTOOLS_CONTAINER_NAMES } from '../../../modals/cdrom-vm-modal/constants';
import { InitialStepStateGetter } from './types';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../selectors/config-map/sc-defaults';
import { toShallowJS } from '../../../../utils/immutable';

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

const getUrlStorage = (storageClassConfigMap: ConfigMapKind) => ({
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
    typeData: { name: prefixedID(VM_TEMPLATE_NAME_PARAMETER, ROOT_DISK_NAME) },
  }).asResource(),
  dataVolume: DataVolumeWrapper.initializeFromSimpleData({
    name: prefixedID(VM_TEMPLATE_NAME_PARAMETER, ROOT_DISK_NAME),
    type: DataVolumeSourceType.HTTP,
    typeData: { url: '' },
    size: 10,
    unit: BinaryUnit.Gi,
  })
    .setVolumeMode(getDefaultSCVolumeMode(storageClassConfigMap))
    .setAccessModes(getDefaultSCAccessModes(storageClassConfigMap))
    .asResource(),
});

export const getProvisionSourceStorage = (
  provisionSource: ProvisionSource,
  iStorageClassConfigMap: any,
): VMWizardStorage => {
  if (provisionSource === ProvisionSource.URL) {
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
});
