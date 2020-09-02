import { ConfigMapModel } from '@console/internal/models';
import {
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME,
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES,
  V2VConfigMapAttribute,
  V2VProviderErrorSpecialUIMessageRequest,
} from '../../../constants/v2v';
import { ConfigMapKind, k8sGet } from '@console/internal/module/k8s';
import {
  getKubevirtV2vVmwareContainerImage,
  getKubevirtV2vConversionContainerImage,
  getVddkInitContainerImage,
} from '../../../selectors/v2v';
import { VMImportProvider } from '../../../components/create-vm-wizard/types';
import { joinGrammaticallyListOfItems } from '@console/shared';
import { K8sDetailError } from '../../enhancedK8sMethods/errors';

const { info } = console;

export const getVmwareConfigMap = async () => {
  let lastErr;
  // query namespaces sequentially to respect order
  for (const namespace of VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const configMap = await k8sGet(
        ConfigMapModel,
        VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME,
        namespace,
      );

      if (configMap) {
        return configMap;
      }
    } catch (e) {
      lastErr = e;
      info(
        `The ${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} can not be found in the ${namespace} namespace.  Another namespace will be queried, if any left. Error: `,
        e,
      );
    }
  }

  throw lastErr;
};

export const validateV2VConfigMap = (configMap: ConfigMapKind, providerType: VMImportProvider) => {
  if (!configMap) {
    return new K8sDetailError({
      title: `${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} ConfigMap missing`,
      message: `${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} ConfigMap cannot be found in any of the following namespaces: ${joinGrammaticallyListOfItems(
        VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES,
        'or',
      )}. Please see ${
        V2VProviderErrorSpecialUIMessageRequest.supplyDoclink
      } for more information.`,
    });
  }
  const requiredImagesMissing = [];

  const checkMissingImage = (key: string, value: string) => {
    if (!value?.trim()) {
      requiredImagesMissing.push(key);
    }
  };

  checkMissingImage(
    V2VConfigMapAttribute.kubevirtVmwareImage,
    getKubevirtV2vVmwareContainerImage(configMap),
  );

  if (providerType === VMImportProvider.VMWARE) {
    checkMissingImage(
      V2VConfigMapAttribute.v2vConversionImage,
      getKubevirtV2vConversionContainerImage(configMap),
    );
    checkMissingImage(V2VConfigMapAttribute.vddkInitImage, getVddkInitContainerImage(configMap));
  }

  if (requiredImagesMissing.length > 0) {
    return new K8sDetailError({
      title: `Image configuration missing`,
      message: `The following images are missing in a ${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} ConfigMap: ${joinGrammaticallyListOfItems(
        requiredImagesMissing,
      )}. Please see ${
        V2VProviderErrorSpecialUIMessageRequest.supplyDoclink
      } for more information.`,
    });
  }

  return null;
};
