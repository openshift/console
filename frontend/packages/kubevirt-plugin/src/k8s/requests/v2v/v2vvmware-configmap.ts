import { ConfigMapModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import {
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMES,
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES,
} from '../../../constants/v2v';

const { info } = console;

export const getVmwareConfigMap = async () => {
  let lastErr;
  // query namespaces sequentially to respect order
  for (const namespace of VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES) {
    for (const configMapName of VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMES) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const configMap = await k8sGet(ConfigMapModel, configMapName, namespace);

        if (configMap) {
          return configMap;
        }
      } catch (e) {
        lastErr = e;
        info(
          `The ${configMapName} can not be found in the ${namespace} namespace.  Another namespace will be queried, if any left. Error: `,
          e,
        );
      }
    }
  }

  throw lastErr;
};
