import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getStorageSize } from '../selectors';
import { DataVolumeSource } from '../../types/dv';

export const getDataVolumeResources = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.resources');

export const getDataVolumeStorageSize = (dataVolume: K8sResourceKind): string =>
  getStorageSize(getDataVolumeResources(dataVolume));

export const getDataVolumeAccessModes = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.accessModes');
export const getDataVolumeVolumeMode = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.volumeMode');
export const getDataVolumeStorageClassName = (dataVolume: K8sResourceKind): string =>
  _.get(dataVolume, 'spec.pvc.storageClassName');

export const getDataVolumeSourceType = (dataVolume: K8sResourceKind) => {
  const source = _.get(dataVolume, 'spec.source');
  if (_.get(source, 'http')) {
    return {
      type: DataVolumeSource.URL,
      url: _.get(dataVolume, 'spec.source.http.url'),
    };
  }
  if (_.get(source, 'pvc')) {
    return {
      type: DataVolumeSource.PVC,
      name: _.get(dataVolume, 'spec.source.pvc.name'),
      namespace: _.get(dataVolume, 'spec.source.pvc.namespace'),
    };
  }
  if (_.get(source, 'blank')) {
    return {
      type: DataVolumeSource.BLANK,
    };
  }
  return {
    type: DataVolumeSource.UNKNOWN,
  };
};
