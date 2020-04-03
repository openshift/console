import { ConfigMapModel } from '@console/internal/models';
import {
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME,
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES,
} from '../../../constants/v2v';

const { info, warn } = console;

const getVmwareConfigMapInNamespace = async ({ k8sGet, namespace }) => {
  try {
    return await k8sGet(ConfigMapModel, VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME, namespace, null, {
      disableHistory: true,
    });
  } catch (e) {
    info(
      `The ${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} can not be found in the ${namespace} namespace.  Another namespace will be queried, if any left. Error: `,
      e,
    );
  }
  return null;
};

export const getVmwareConfigMap = async (props) => {
  // query namespaces sequentially to respect order
  for (const namespace of VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES) {
    // eslint-disable-next-line no-await-in-loop
    const configMap = await getVmwareConfigMapInNamespace({
      namespace,
      ...props,
    });
    if (configMap) {
      return configMap;
    }
  }
  warn(
    `The ${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} can not be found in none of following namespaces: `,
    JSON.stringify(VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES),
    '. The v2v pods can not be created.',
  );
  return null;
};
