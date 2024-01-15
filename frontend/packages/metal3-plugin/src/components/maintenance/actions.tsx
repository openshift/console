import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action, ExtensionHook, K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeKind } from '@console/internal/module/k8s';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import { findNodeMaintenance } from '../../selectors';
import { startNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import stopNodeMaintenanceModal from '../modals/StopNodeMaintenanceModal';

export const useNodeMaintenanceActions: ExtensionHook<Action[], NodeKind> = (resource) => {
  const { t } = useTranslation();
  const [maintenanceModel] = useMaintenanceCapability();

  const [maintenances, loading, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    isList: true,
    groupVersionKind: {
      kind: maintenanceModel.kind,
      version: maintenanceModel.apiVersion,
      group: maintenanceModel.apiGroup,
    },
    namespaced: false,
  });

  const actions = React.useMemo(() => {
    const nodeMaintenance = findNodeMaintenance(maintenances, resource.metadata.name);

    let action: Action = {
      id: 'start-node-maintenance',
      label: t('metal3-plugin~Start Maintenance'),
      cta: () => startNodeMaintenanceModal({ nodeName: resource.metadata.name }),
      insertBefore: 'edit-labels',
    };

    if (nodeMaintenance) {
      action = {
        id: 'stop-node-maintenance',
        label: t('metal3-plugin~Stop Maintenance'),
        cta: () => stopNodeMaintenanceModal(nodeMaintenance, t),
        insertBefore: 'edit-labels',
      };
    }
    return [action];
  }, [maintenances, resource.metadata.name, t]);

  return [actions, loading, loadError];
};
