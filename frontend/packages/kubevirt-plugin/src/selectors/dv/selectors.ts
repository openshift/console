import * as _ from 'lodash';

import { K8sResourceKind } from '@console/internal/module/k8s';

import { V1DataVolumeTemplateSpec } from '../../types';
import { V1alpha1DataVolume } from '../../types/api';
import { getStorageSize } from '../selectors';

export const getDataVolumeResources = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.resources');

export const getDataVolumeStorageSize = (dataVolume: K8sResourceKind): string =>
  getStorageSize(getDataVolumeResources(dataVolume));

export const getDataVolumeAccessModes = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.accessModes');
export const getDataVolumeVolumeMode = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.volumeMode');
export const getDataVolumePreallocationDisk = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.preallocation');
export const getDataVolumeStorageClassName = (dataVolume: K8sResourceKind): string =>
  _.get(dataVolume, 'spec.pvc.storageClassName');

export const toDataVolumeTemplateSpec = (
  dataVolume: V1alpha1DataVolume,
): V1DataVolumeTemplateSpec =>
  dataVolume
    ? {
        metadata: _.get(dataVolume, 'metadata'),
        spec: _.get(dataVolume, 'spec'),
      }
    : null;
