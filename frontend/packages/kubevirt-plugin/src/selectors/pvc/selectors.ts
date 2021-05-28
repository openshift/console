import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import {
  CDI_CLONE_TOKEN_ANNOTAION,
  CDI_UPLOAD_POD_ANNOTATION,
  CDI_UPLOAD_POD_NAME_ANNOTATION,
  CDI_PVC_PHASE_RUNNING,
} from '../../components/cdi-upload-provider/consts';
import { CDI_KUBEVIRT_IO, STORAGE_IMPORT_POD_LABEL } from '../../constants';
import { DataVolumeModel } from '../../models';
import { getAnnotation, getStorageSize } from '../selectors';

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

export const getPvcPhase = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, CDI_UPLOAD_POD_ANNOTATION);

export const getPvcCloneToken = (pvc: PersistentVolumeClaimKind) =>
  getAnnotation(pvc, CDI_CLONE_TOKEN_ANNOTAION);

export const isPvcUploading = (pvc: PersistentVolumeClaimKind) =>
  !getPvcCloneToken(pvc) && getPvcUploadPodName(pvc) && getPvcPhase(pvc) === CDI_PVC_PHASE_RUNNING;

export const isPvcCloning = (pvc: PersistentVolumeClaimKind) =>
  !!getPvcCloneToken(pvc) && getPvcPhase(pvc) === CDI_PVC_PHASE_RUNNING;

export const isPvcBoundToCDI = (pvc: PersistentVolumeClaimKind) =>
  pvc?.metadata?.ownerReferences?.some(
    (or) =>
      or.apiVersion.startsWith(CDI_KUBEVIRT_IO) &&
      or.kind === DataVolumeModel.kind &&
      or.name === pvc?.metadata?.name,
  );
