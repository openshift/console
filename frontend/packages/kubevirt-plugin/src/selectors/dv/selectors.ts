import * as _ from 'lodash';

import { getStorageSize } from '../selectors';

export const getDataVolumeResources = (dataVolume) => _.get(dataVolume, 'spec.pvc.resources');

export const getDataVolumeStorageSize = (dataVolume): string =>
  getStorageSize(getDataVolumeResources(dataVolume));

export const getDataVolumeStorageClassName = (dataVolume): string =>
  _.get(dataVolume, 'spec.pvc.storageClassName');
