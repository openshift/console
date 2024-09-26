import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { CDI_UPLOAD_POD_NAME_ANNOTATION } from '../../components/cdi-upload-provider/consts';
import { STORAGE_IMPORT_POD_LABEL } from '../../constants/cdi';
import { getAnnotation } from '../k8sCommon';
import { getStorageSize } from '../selectors';

export const getPvcImportPodName = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, STORAGE_IMPORT_POD_LABEL);

export const getPvcUploadPodName = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, CDI_UPLOAD_POD_NAME_ANNOTATION);

export const getPvcResources = (pvc: PersistentVolumeClaimKind) => pvc?.spec?.resources;

export const getPvcStorageSize = (pvc: PersistentVolumeClaimKind): string =>
  getStorageSize(getPvcResources(pvc));

export const getPvcAccessModes = (pvc: PersistentVolumeClaimKind) => pvc?.spec?.accessModes;
export const getPvcVolumeMode = (pvc: PersistentVolumeClaimKind) => pvc?.spec?.volumeMode;
export const getPvcStorageClassName = (pvc: PersistentVolumeClaimKind): string =>
  pvc?.spec?.storageClassName;
