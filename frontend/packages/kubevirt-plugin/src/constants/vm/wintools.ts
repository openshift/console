import { ConfigMapKind } from '@console/internal/module/k8s';

import { getVmwareConfigMap } from '../../k8s/requests/v2v/v2vvmware-configmap';
import { VIRTIO_WIN_IMAGE } from './constants';

type winToolsContainerNamesResult = {
  openshift: string;
  ocp: string;
  online: string;
  dedicated: string;
  azure: string;
  okd: string;
};

export const winToolsContainerNames = (): winToolsContainerNamesResult => {
  const configMap = getVmwareConfigMap() as ConfigMapKind;
  const winImage =
    configMap?.data?.[VIRTIO_WIN_IMAGE] ||
    'registry.redhat.io/container-native-virtualization/virtio-win';
  return {
    openshift: winImage,
    ocp: winImage,
    online: winImage,
    dedicated: winImage,
    azure: winImage,
    okd: 'kubevirt/virtio-container-disk', // comunity version is always "latest"
  };
};
