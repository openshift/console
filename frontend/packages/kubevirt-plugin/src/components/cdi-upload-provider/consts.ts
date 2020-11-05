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
export const CDI_UPLOAD_RUNNING = 'Running';
export const CDI_UPLOAD_OS_URL_PARAM = 'os';

export const CDI_UPLOAD_SUPPORTED_TYPES_URL =
  'https://docs.openshift.com/container-platform/4.5/virt/virtual_machines/importing_vms/virt-importing-virtual-machine-images-datavolumes.html#virt-cdi-supported-operations-matrix_virt-importing-virtual-machine-images-datavolumes';
