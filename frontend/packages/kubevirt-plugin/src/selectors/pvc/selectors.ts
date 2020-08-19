import * as _ from 'lodash';
import { getStorageSize, getAnnotation } from '../selectors';
import {
  CDI_UPLOAD_RUNNING,
  CDI_UPLOAD_POD_ANNOTATION,
  CDI_UPLOAD_POD_NAME_ANNOTATION,
} from '../../components/cdi-upload-provider/consts';
import { STORAGE_IMPORT_POD_LABEL } from '../../constants';

export const getPvcResources = (pvc) => _.get(pvc, 'spec.resources');

export const getPvcStorageSize = (pvc): string => getStorageSize(getPvcResources(pvc));

export const getPvcAccessModes = (pvc) => _.get(pvc, 'spec.accessModes');
export const getPvcVolumeMode = (pvc) => _.get(pvc, 'spec.volumeMode');
export const getPvcStorageClassName = (pvc): string => _.get(pvc, 'spec.storageClassName');

export const getPvcImportPodName = (pvc) => getAnnotation(pvc, STORAGE_IMPORT_POD_LABEL);

// upload pvc selectors
export const getPvcUploadPodName = (pvc) => getAnnotation(pvc, CDI_UPLOAD_POD_NAME_ANNOTATION);

export const getPvcUploadPhase = (pvc) => getAnnotation(pvc, CDI_UPLOAD_POD_ANNOTATION);

export const isPvcUploading = (pvc) =>
  getPvcUploadPodName(pvc) && getPvcUploadPhase(pvc) === CDI_UPLOAD_RUNNING;
