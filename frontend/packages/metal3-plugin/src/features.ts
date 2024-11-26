import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { setFlag, handleError } from '@console/internal/actions/features';
import { fetchK8s } from '@console/internal/graphql/client';
import { InfrastructureModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FeatureDetector } from '@console/plugin-sdk';
import { getInfrastructurePlatform } from '@console/shared/src/selectors/infrastructure';
import { useMaintenanceCapability } from './hooks/useMaintenanceCapability';
import { ProvisioningModel } from './models';

export const BAREMETAL_FLAG = 'BAREMETAL';
export const NODE_MAINTENANCE_FLAG = 'NODE_MAINTENANCE';
export const NODE_MAINTENANCE_ENABLED_FLAG = 'NODE_MAINTENANCE_ENABLED';
export const BMO_ENABLED_FLAG = 'BMO_ENABLED';
export const NODE_MAINTENANCE_KV_BETA_FLAG = 'NODE_MAINTENANCE_KV_BETA';
export const NODE_MAINTENANCE_KV_ALPHA_FLAG = 'NODE_MAINTENANCE_KV_ALPHA';

export const detectBaremetalPlatform: FeatureDetector = (dispatch) =>
  fetchK8s<K8sResourceKind>(InfrastructureModel, 'cluster').then(
    (infra) => dispatch(setFlag(BAREMETAL_FLAG, getInfrastructurePlatform(infra) === 'BareMetal')),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(BAREMETAL_FLAG, false))
        : handleError(err, BAREMETAL_FLAG, dispatch, detectBaremetalPlatform);
    },
  );

export const detectBMOEnabled: FeatureDetector = (dispatch) =>
  fetchK8s<K8sResourceKind>(ProvisioningModel, 'provisioning-configuration').then(
    () => dispatch(setFlag(BMO_ENABLED_FLAG, true)),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(BMO_ENABLED_FLAG, false))
        : handleError(err, BMO_ENABLED_FLAG, dispatch, detectBMOEnabled);
    },
  );

export const useDetectNodeMaintenance = (setFeatureFlag: SetFeatureFlag) => {
  const [model, loading] = useMaintenanceCapability();
  if (!loading) {
    setFeatureFlag(NODE_MAINTENANCE_ENABLED_FLAG, !!model);
  }
};
