import * as _ from 'lodash';
import { VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME } from '../../constants/v2v';
import { ConfigMapKind } from '@console/internal/module/k8s';

export const getVMWareConnectionName = (value) => value && value.spec && value.spec.connection;

// full image name of kubevirt-v2v-conversion
// Presence and proper content of the ConfigMap is hard requirement, so ensure proper info makes it into the logs otherwise.
export const getKubevirtV2vConversionContainerImage = (kubevirtVmwareConfigMap: ConfigMapKind) =>
  _.get(
    kubevirtVmwareConfigMap,
    ['data', 'v2v-conversion-image'],
    `v2v-conversion-image is missing in the ${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} ConfigMap`,
  );

// the kubevirt-vmware provider is responsible for reading VMs list/details from the VMware API
export const getKubevirtV2vVmwareContainerImage = (kubevirtVmwareConfigMap: ConfigMapKind) =>
  _.get(
    kubevirtVmwareConfigMap,
    ['data', 'kubevirt-vmware-image'],
    `kubevirt-vmware-image is missing in the ${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} ConfigMap`,
  );

export const getVddkInitContainerImage = (kubevirtVmwareConfigMap: ConfigMapKind) =>
  _.get(
    kubevirtVmwareConfigMap,
    ['data', 'vddk-init-image'],
    `vddk-init-image is missing in the ${VMWARE_KUBEVIRT_VMWARE_CONFIG_MAP_NAME} ConfigMap`,
  );

// optional param in the ConfigMap
export const getV2vImagePullPolicy = (kubevirtVmwareConfigMap: ConfigMapKind) =>
  _.get(kubevirtVmwareConfigMap, ['data', 'kubevirt-vmware-image-pull-policy'], 'IfNotPresent');
