export enum UPLOAD_STATUS {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  CANCELED = 'CANCELED',
}

export const CDI_UPLOAD_POD_ANNOTATION = 'cdi.kubevirt.io/storage.pod.phase';
export const CDI_UPLOAD_POD_NAME_ANNOTATION = 'cdi.kubevirt.io/storage.uploadPodName';
export const CDI_UPLOAD_RUNNING = 'Running';
