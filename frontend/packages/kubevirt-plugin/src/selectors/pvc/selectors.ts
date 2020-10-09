import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { getStorageSize, getAnnotation } from '../selectors';
import {
  CDI_UPLOAD_RUNNING,
  CDI_UPLOAD_POD_ANNOTATION,
  CDI_UPLOAD_POD_NAME_ANNOTATION,
  CDI_PHASE_PVC_ANNOTATION,
  CDI_BOUND_PVC_ANNOTATION,
} from '../../components/cdi-upload-provider/consts';
import { STORAGE_IMPORT_POD_LABEL } from '../../constants';

export const getPvcResources = (pvc: PersistentVolumeClaimKind) => pvc?.spec?.resources;

export const getPvcStorageSize = (pvc: PersistentVolumeClaimKind): string =>
  getStorageSize(getPvcResources(pvc));

export const getPvcAccessModes = (pvc: PersistentVolumeClaimKind) => pvc?.spec?.accessModes;
export const getPvcVolumeMode = (pvc: PersistentVolumeClaimKind) => pvc?.spec?.volumeMode;
export const getPvcStorageClassName = (pvc: PersistentVolumeClaimKind): string =>
  pvc?.spec?.storageClassName;

export const getPvcImportPodName = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, STORAGE_IMPORT_POD_LABEL);

// upload pvc selectors
export const getPvcUploadPodName = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, CDI_UPLOAD_POD_NAME_ANNOTATION);

export const getPvcUploadPhase = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, CDI_UPLOAD_POD_ANNOTATION);

export const isPvcUploading = (pvc: PersistentVolumeClaimKind) =>
  getPvcUploadPodName(pvc) && getPvcUploadPhase(pvc) === CDI_UPLOAD_RUNNING;

export const isPvcBoundToCDI = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, CDI_BOUND_PVC_ANNOTATION) === 'true' ||
  getAnnotation(pvc, CDI_PHASE_PVC_ANNOTATION) === 'Succeeded' ||
  getAnnotation(pvc, CDI_PHASE_PVC_ANNOTATION) === 'Running';
