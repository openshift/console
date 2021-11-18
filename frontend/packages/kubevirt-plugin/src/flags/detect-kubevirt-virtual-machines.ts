import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { fetchSwagger } from '@console/internal/module/k8s';
import {
  FLAG_KUBEVIRT,
  FLAG_KUBEVIRT_HAS_PRINTABLESTATUS,
  FLAG_KUBEVIRT_HAS_V1_API,
  FLAG_KUBEVIRT_HAS_V1ALPHA3_API,
} from './const';

export const detectKubevirtVirtualMachines = async (setFeatureFlag: SetFeatureFlag) => {
  // eslint-disable-next-line no-console
  console.warn('xxx detectKubevirtVirtualMachines call fetchSwagger now and every 10 seconds');
  let id = null;

  // Get swagger schema
  const updateKubevirtFlags = () => {
    fetchSwagger()
      .then((yamlOpenAPI) => {
        // Check for known apiVersions
        const hasV1APIVersion = !!yamlOpenAPI['io.kubevirt.v1.VirtualMachine'];
        const hasV1Alpha3APIVersion = !!yamlOpenAPI['io.kubevirt.v1alpha3.VirtualMachine'];

        // Check for schema features
        const hasPrintableStatus =
          hasV1APIVersion &&
          !!yamlOpenAPI['io.kubevirt.v1.VirtualMachine']?.properties?.status?.properties
            ?.printableStatus;

        setFeatureFlag(FLAG_KUBEVIRT, hasV1APIVersion || hasV1Alpha3APIVersion);
        setFeatureFlag(FLAG_KUBEVIRT_HAS_V1_API, hasV1APIVersion);
        setFeatureFlag(FLAG_KUBEVIRT_HAS_V1ALPHA3_API, hasV1Alpha3APIVersion && !hasV1APIVersion);
        setFeatureFlag(FLAG_KUBEVIRT_HAS_PRINTABLESTATUS, hasPrintableStatus);
      })
      .catch(() => {
        clearInterval(id);
      });
  };

  updateKubevirtFlags();
  id = setInterval(() => {
    // eslint-disable-next-line no-console
    console.warn('xxx detectKubevirtVirtualMachines run fetchSwagger every 10 seconds');
    updateKubevirtFlags();
  }, 10 * 1000);
};
