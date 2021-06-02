import { ConfigMapKind } from '@console/internal/module/k8s';
import { getVmwareConfigMap } from '../../k8s/requests/v2v/v2vvmware-configmap';
import { VIRTIO_WIN_IMAGE } from './constants';

type winToolsContainerNamesResult = {
  openshift: Promise<string> | string;
  ocp: Promise<string> | string;
  online: Promise<string> | string;
  dedicated: Promise<string> | string;
  azure: Promise<string> | string;
  okd: string;
};

export const winToolsContainerNames = (images?: {
  [key: string]: string;
}): winToolsContainerNamesResult => {
  const configMapImages = async () => {
    const configMap = (await getVmwareConfigMap()) as ConfigMapKind;
    return configMap?.data?.[VIRTIO_WIN_IMAGE];
  };

  const winImage =
    images?.[VIRTIO_WIN_IMAGE] ||
    configMapImages() ||
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
