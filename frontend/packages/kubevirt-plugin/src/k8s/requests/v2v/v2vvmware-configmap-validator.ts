import { ConfigMapKind } from '@console/internal/module/k8s';
import { joinGrammaticallyListOfItems } from '@console/shared';
import { VMImportProvider } from '../../../components/create-vm-wizard/types';
import {
  V2VConfigMapAttribute,
  V2VProviderErrorSpecialUIMessageRequest,
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME,
  VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAMESPACES,
} from '../../../constants/v2v';
import {
  getKubevirtV2vConversionContainerImage,
  getKubevirtV2vVmwareContainerImage,
  getVddkInitContainerImage,
} from '../../../selectors/v2v';
import { K8sDetailError } from '../../enhancedK8sMethods/errors';

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
