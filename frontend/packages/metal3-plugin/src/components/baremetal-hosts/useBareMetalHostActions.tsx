import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Action, ExtensionHook, K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeModel } from '@console/internal/models';
import { NodeKind } from '@console/internal/module/k8s';
import { HOST_POWER_STATUS_POWERED_ON, HOST_POWER_STATUS_POWERED_OFF } from '../../constants';
import { useMaintenanceCapability } from '../../hooks/useMaintenanceCapability';
import {
  findNodeMaintenance,
  getHostPowerStatus,
  hasPowerManagement,
  isDetached,
} from '../../selectors';
import { BareMetalHostKind } from '../../types';
import { usePowerOffHostModal } from '../modals/PowerOffHostModal';
import { useRestartHostModal } from '../modals/RestartHostModal';
import { useStartNodeMaintenanceModal } from '../modals/StartNodeMaintenanceModal';
import { useStopNodeMaintenanceModal } from '../modals/StopNodeMaintenanceModal';

export const useBareMetalHostActions: ExtensionHook<Action[], BareMetalHostKind> = (resource) => {
  const { t } = useTranslation();
  const [maintenanceModel] = useMaintenanceCapability();
  const powerOffHostModal = usePowerOffHostModal();
  const restartHostModal = useRestartHostModal();
  const startNodeMaintenanceModal = useStartNodeMaintenanceModal();
  const stopNodeMaintenanceModal = useStopNodeMaintenanceModal();

  const [nodes, nodesLoaded] = useK8sWatchResource<NodeKind[]>({
    kind: NodeModel.kind,
    namespaced: false,
    isList: true,
  });

  const [maintenances, maintenancesLoaded] = useK8sWatchResource<K8sResourceCommon[]>({
    isList: true,
    groupVersionKind: {
      kind: maintenanceModel.kind,
      version: maintenanceModel.apiVersion,
      group: maintenanceModel.apiGroup,
    },
    namespaced: false,
  });

  const actions = React.useMemo(() => {
    if (!nodesLoaded || !maintenancesLoaded) {
      return [];
    }

    const node = nodes?.find((n) => n.metadata.name === resource.spec?.consumerRef?.name);
    const nodeMaintenance = node ? findNodeMaintenance(maintenances, node.metadata.name) : null;
    const powerStatus = getHostPowerStatus(resource);
    const hasPowerMgmt = hasPowerManagement(resource);
    const isHostDetached = isDetached(resource);

    const result: Action[] = [];

    // Power Off action
    if (powerStatus === HOST_POWER_STATUS_POWERED_ON && hasPowerMgmt && !isHostDetached) {
      result.push({
        id: 'power-off-host',
        label: t('metal3-plugin~Power Off'),
        cta: () =>
          powerOffHostModal({
            host: resource,
            nodeName: node?.metadata.name || '',
            status: { status: node?.status?.conditions?.[0]?.type || 'Unknown' },
          }),
        insertBefore: 'edit-labels',
      });
    }

    // Power On action
    if (powerStatus === HOST_POWER_STATUS_POWERED_OFF && hasPowerMgmt && !isHostDetached) {
      result.push({
        id: 'power-on-host',
        label: t('metal3-plugin~Power On'),
        cta: () => {
          // TODO: Implement power on functionality
        },
        insertBefore: 'edit-labels',
      });
    }

    // Restart action
    if (powerStatus === HOST_POWER_STATUS_POWERED_ON && hasPowerMgmt && !isHostDetached) {
      result.push({
        id: 'restart-host',
        label: t('metal3-plugin~Restart'),
        cta: () => restartHostModal({ host: resource }),
        insertBefore: 'edit-labels',
      });
    }

    // Maintenance actions
    if (node && maintenanceModel) {
      if (nodeMaintenance) {
        result.push({
          id: 'stop-node-maintenance',
          label: t('metal3-plugin~Stop Maintenance'),
          cta: () => stopNodeMaintenanceModal(nodeMaintenance),
          insertBefore: 'edit-labels',
        });
      } else {
        result.push({
          id: 'start-node-maintenance',
          label: t('metal3-plugin~Start Maintenance'),
          cta: () => startNodeMaintenanceModal({ nodeName: node.metadata.name }),
          insertBefore: 'edit-labels',
        });
      }
    }

    return result;
  }, [
    nodes,
    nodesLoaded,
    maintenances,
    maintenancesLoaded,
    resource,
    powerOffHostModal,
    restartHostModal,
    startNodeMaintenanceModal,
    stopNodeMaintenanceModal,
    maintenanceModel,
    t,
  ]);

  return [actions, nodesLoaded && maintenancesLoaded, null];
};
