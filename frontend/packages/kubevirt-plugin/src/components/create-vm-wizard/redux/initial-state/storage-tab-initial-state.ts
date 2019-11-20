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

const ROOT_DISK_NAME = 'rootdisk';

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
  isValid: true, // empty Storages are valid
  hasAllRequiredFilled: true,
});
