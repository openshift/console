export enum UPLOAD_STATUS {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  CANCELED = 'CANCELED',
}
export const CDI_UPLOAD_URL_BUILDER = (uploadProxyURL) =>
  `https://${uploadProxyURL}/v1beta1/upload-form-async`;
export const CDI_UPLOAD_POD_ANNOTATION = 'cdi.kubevirt.io/storage.pod.phase';
export const CDI_UPLOAD_POD_NAME_ANNOTATION = 'cdi.kubevirt.io/storage.uploadPodName';
export const CDI_PHASE_PVC_ANNOTATION = 'cdi.kubevirt.io/storage.pod.phase';
export const CDI_BOUND_PVC_ANNOTATION = 'cdi.kubevirt.io/storage.condition.bound';
export const CDI_BIND_REQUESTED_ANNOTATION = 'cdi.kubevirt.io/storage.bind.immediate.requested';
export const CDI_CLONE_TOKEN_ANNOTAION = 'cdi.kubevirt.io/storage.clone.token';
export const CDI_PVC_PHASE_RUNNING = 'Running';
export const CDI_UPLOAD_OS_URL_PARAM = 'os';

export const CDI_UPLOAD_SUPPORTED_TYPES_URL =
  'https://access.redhat.com/documentation/en-us/openshift_container_platform/4.9/html/virtualization/virtual-machines#virt-cdi-supported-operations-matrix_virt-importing-virtual-machine-images-datavolumes';
