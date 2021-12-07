import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { V1DataVolumeTemplateSpec } from '../../types';
import { V1alpha1DataVolume } from '../../types/api';
import { getStorageSize } from '../selectors';

// this exist to keep supporting pvc sections to existing users
export const getPVCDataVolumeAccessModes = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.accessModes');
export const getPVCDataVolumeVolumeMode = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.volumeMode');
export const getPVCDataVolumeStorageClassName = (dataVolume: K8sResourceKind): string =>
  _.get(dataVolume, 'spec.pvc.storageClassName');
export const getPVCDataVolumeResources = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.resources');

export const getDataVolumeResources = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.storage.resources') || getPVCDataVolumeResources(dataVolume);

export const getDataVolumeStorageSize = (dataVolume: K8sResourceKind): string =>
  getStorageSize(getDataVolumeResources(dataVolume));

export const getDataVolumeAccessModes = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.storage.accessModes') || getPVCDataVolumeAccessModes(dataVolume);
export const getDataVolumeVolumeMode = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.storage.volumeMode') || getPVCDataVolumeVolumeMode(dataVolume);
export const getDataVolumeStorageClassName = (dataVolume: K8sResourceKind): string =>
  _.get(dataVolume, 'spec.storage.storageClassName') ||
  getPVCDataVolumeStorageClassName(dataVolume);
export const getDataVolumePreallocationDisk = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.preallocation');

export const toDataVolumeTemplateSpec = (
  dataVolume: V1alpha1DataVolume,
): V1DataVolumeTemplateSpec =>
  dataVolume
    ? {
        metadata: _.get(dataVolume, 'metadata'),
        spec: _.get(dataVolume, 'spec'),
      }
    : null;
