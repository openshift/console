import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action, ExtensionHook, K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeKind } from '@console/internal/module/k8s';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { findNodeMaintenance } from '../../selectors';
import { useStartNodeMaintenanceModalLauncher } from '../modals/StartNodeMaintenanceModal';
import { useStopNodeMaintenanceModal } from '../modals/StopNodeMaintenanceModal';

export const useNodeMaintenanceActions: ExtensionHook<Action[], NodeKind> = (resource) => {
  const { t } = useTranslation();
  const [maintenanceModel] = useMaintenanceCapability();
  const startNodeMaintenanceModal = useStartNodeMaintenanceModalLauncher({
    nodeName: resource.metadata.name,
  });
  const [maintenances, loading, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    isList: true,
    groupVersionKind: {
      kind: maintenanceModel.kind,
      version: maintenanceModel.apiVersion,
      group: maintenanceModel.apiGroup,
    },
    namespaced: false,
  });

  const nodeMaintenance = findNodeMaintenance(maintenances, resource.metadata.name);
  const stopNodeMaintenanceModalLauncher = useStopNodeMaintenanceModal(nodeMaintenance);

  const actions = useMemo(() => {
    let action: Action = {
      id: 'start-node-maintenance',
      label: t('metal3-plugin~Start Maintenance'),
      cta: startNodeMaintenanceModal,
      insertBefore: 'edit-labels',
    };

    if (nodeMaintenance) {
      action = {
        id: 'stop-node-maintenance',
        label: t('metal3-plugin~Stop Maintenance'),
        cta: () => stopNodeMaintenanceModalLauncher(),
        insertBefore: 'edit-labels',
      };
    }
    return [action];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maintenances, resource.metadata.name, t, stopNodeMaintenanceModalLauncher]);

  return [actions, loading, loadError];
};
