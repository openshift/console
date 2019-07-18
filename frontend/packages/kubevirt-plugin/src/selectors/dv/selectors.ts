import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getStorageSize } from '../selectors';

export const getDataVolumeResources = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.resources');

export const getDataVolumeStorageSize = (dataVolume: K8sResourceKind): string =>
  getStorageSize(getDataVolumeResources(dataVolume));

export const getDataVolumeAccessModes = (dataVolume: K8sResourceKind) =>
  _.get(dataVolume, 'spec.pvc.accessModes');
export const getDataVolumeStorageClassName = (dataVolume: K8sResourceKind): string =>
  _.get(dataVolume, 'spec.pvc.storageClassName');
