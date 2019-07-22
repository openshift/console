import * as _ from 'lodash';
import { getStorageSize } from '../selectors';

export const getPvcResources = (pvc) => _.get(pvc, 'spec.resources');

export const getPvcStorageSize = (pvc): string => getStorageSize(getPvcResources(pvc));

export const getPvcAccessModes = (pvc) => _.get(pvc, 'spec.accessModes');
export const getPvcStorageClassName = (pvc): string => _.get(pvc, 'spec.storageClassName');
