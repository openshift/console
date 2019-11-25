import { VMWizardStorage, VMWizardStorageType } from '../../types';
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

const urlStorage = {
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
  }).asResource(),
};

export const getProvisionSourceStorage = (provisionSource: ProvisionSource): VMWizardStorage => {
  if (provisionSource === ProvisionSource.URL) {
    return urlStorage;
  }
  if (provisionSource === ProvisionSource.CONTAINER) {
    return containerStorage;
  }
  return null;
};

export const getStorageInitialState = () => ({
  value: [],
  error: null,
  isValid: true, // empty Storages are valid
  hasAllRequiredFilled: true,
});
