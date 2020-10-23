import { V2VConfigMapAttribute } from '../../constants/v2v';
import { ConfigMapKind, ImagePullPolicy } from '@console/internal/module/k8s';

export const getV2VConnectionName = (value) => value && value.spec && value.spec.connection;

export const getKubevirtV2vVmwareContainerImage = (kubevirtVmwareConfigMap: ConfigMapKind) => {
  return (
    kubevirtVmwareConfigMap?.data &&
    kubevirtVmwareConfigMap?.data[V2VConfigMapAttribute.kubevirtVmwareImage]
  );
};

export const getV2vImagePullPolicy = (
  kubevirtVmwareConfigMap: ConfigMapKind,
  defaultValue = 'IfNotPresent',
) => {
  return ((kubevirtVmwareConfigMap?.data &&
    kubevirtVmwareConfigMap?.data[V2VConfigMapAttribute.kubevirtVmwareImagePullPolicy]) ||
    defaultValue) as ImagePullPolicy;
};

export const getKubevirtV2vConversionContainerImage = (
  kubevirtVmwareConfigMap: ConfigMapKind,
): string => {
  return (
    kubevirtVmwareConfigMap?.data &&
    kubevirtVmwareConfigMap?.data[V2VConfigMapAttribute.v2vConversionImage]
  );
};

export const getVddkInitContainerImage = (kubevirtVmwareConfigMap: ConfigMapKind): string => {
  return (
    kubevirtVmwareConfigMap?.data &&
    kubevirtVmwareConfigMap?.data[V2VConfigMapAttribute.vddkInitImage]
  );
};
