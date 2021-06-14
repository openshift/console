import { testName } from '@console/internal-integration-tests/protractor.conf';
import { PVCData } from '../../types/pvc';
import { STORAGE_CLASS } from './common';
import { OperatingSystem } from './wizard';

export const GOLDEN_OS_IMAGES_NS = 'openshift-virtualization-os-images';
export enum GOLDEN_OS_PVC_NAME {
  FEDORA = 'fedora',
  RHEL7 = 'rhel7',
  RHEL8 = 'rhel8',
  WIN10 = 'win10',
}

export const { LOCAL_CIRROS_IMAGE = '/tmp/cirros.qcow2' } = process.env;
export const { LOCAL_FEDORA_IMAGE = '/tmp/fedora.qcow2' } = process.env;
export const { LOCAL_RHEL7_IMAGE = '/tmp/rhel7.qcow2' } = process.env;
export const { LOCAL_WIN10_IMAGE = '/tmp/win10.qcow2' } = process.env;

export const CIRROS_PVC: PVCData = {
  namespace: testName,
  image: LOCAL_CIRROS_IMAGE,
  pvcName: `test-upload-pvc-${testName}`,
  pvcSize: '1',
  storageClass: STORAGE_CLASS,
};

export const FEDORA_PVC: PVCData = {
  namespace: GOLDEN_OS_IMAGES_NS,
  image: LOCAL_FEDORA_IMAGE,
  os: OperatingSystem.FEDORA,
  pvcName: GOLDEN_OS_PVC_NAME.FEDORA,
  pvcSize: '1',
  storageClass: STORAGE_CLASS,
};

export const RHEL7_PVC: PVCData = {
  namespace: GOLDEN_OS_IMAGES_NS,
  image: LOCAL_RHEL7_IMAGE,
  os: OperatingSystem.RHEL7,
  pvcName: GOLDEN_OS_PVC_NAME.RHEL7,
  pvcSize: '1',
  storageClass: STORAGE_CLASS,
};

export const WIN10_PVC: PVCData = {
  namespace: GOLDEN_OS_IMAGES_NS,
  image: LOCAL_WIN10_IMAGE,
  os: OperatingSystem.WINDOWS_10,
  pvcName: GOLDEN_OS_PVC_NAME.WIN10,
  pvcSize: '1',
  storageClass: STORAGE_CLASS,
};

export enum PVC_ACTION {
  Delete = 'Delete PersistentVolumeClaim',
}
