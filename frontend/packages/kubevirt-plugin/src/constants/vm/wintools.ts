import { ConfigMapKind } from '@console/internal/module/k8s';
import { getVmwareConfigMap } from '../../k8s/requests/v2v/v2vvmware-configmap';
import { VIRTIO_WIN_IMAGE } from './constants';

type WinToolsContainerNamesResult = {
  openshift: Promise<string> | string;
  ocp: Promise<string> | string;
  online: Promise<string> | string;
  dedicated: Promise<string> | string;
  azure: Promise<string> | string;
  okd: string;
};

export const winToolsContainerNames = (images?: {
  [key: string]: string;
}): WinToolsContainerNamesResult => {
  const configMapImages = async () => {
    let configMap: ConfigMapKind;
    try {
      configMap = (await getVmwareConfigMap()) as ConfigMapKind;
    } catch ({ message }) {
      // eslint-disable-next-line no-console
      console.error(message);
    }
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
