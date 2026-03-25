import { useEffect } from 'react';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { InfrastructureModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { getInfrastructurePlatform } from '@console/shared/src/selectors/infrastructure';
import { useMaintenanceCapability } from './hooks/useMaintenanceCapability';
import { ProvisioningModel } from './models';

export const BAREMETAL_FLAG = 'BAREMETAL';
export const NODE_MAINTENANCE_FLAG = 'NODE_MAINTENANCE';
export const NODE_MAINTENANCE_ENABLED_FLAG = 'NODE_MAINTENANCE_ENABLED';
export const BMO_ENABLED_FLAG = 'BMO_ENABLED';
export const NODE_MAINTENANCE_KV_BETA_FLAG = 'NODE_MAINTENANCE_KV_BETA';
export const NODE_MAINTENANCE_KV_ALPHA_FLAG = 'NODE_MAINTENANCE_KV_ALPHA';

export const useDetectNodeMaintenance = (setFeatureFlag: SetFeatureFlag) => {
  const [model, loading] = useMaintenanceCapability();
  if (!loading) {
    setFeatureFlag(NODE_MAINTENANCE_ENABLED_FLAG, !!model);
  }
};

export const useDetectBaremetalPlatform = (setFeatureFlag: SetFeatureFlag) => {
  const [infra, loaded, error] = useK8sGet<K8sResourceKind>(InfrastructureModel, 'cluster');
  useEffect(() => {
    if (loaded && !error) {
      setFeatureFlag(BAREMETAL_FLAG, getInfrastructurePlatform(infra) === 'BareMetal');
    } else if (error) {
      setFeatureFlag(BAREMETAL_FLAG, false);
    }
  }, [error, infra, loaded, setFeatureFlag]);
};

export const useDetectBMOEnabled = (setFeatureFlag: SetFeatureFlag) => {
  const [bmo, loaded, error] = useK8sGet<K8sResourceKind>(
    ProvisioningModel,
    'provisioning-configuration',
  );
  useEffect(() => {
    if (loaded && !error) {
      setFeatureFlag(BMO_ENABLED_FLAG, true);
    } else if (error) {
      setFeatureFlag(BMO_ENABLED_FLAG, false);
    }
  }, [error, bmo, loaded, setFeatureFlag]);
};
