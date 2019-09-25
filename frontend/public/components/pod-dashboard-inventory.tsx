import * as React from 'react';
import { DashboardItemProps } from '@console/internal/components/dashboards-page/with-dashboard-resources';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardBody,
} from '@console/internal/components/dashboard/dashboard-card';
import { getPodContainers, getPodVolumes } from '@console/shared';
import { InventoryBody } from '@console/internal/components/dashboard/inventory-card/inventory-body';
import { InventoryItem } from '@console/internal/components/dashboard/inventory-card/inventory-item';
import { PodDashboardContext } from './pod-dashboard-context';

export const PodDashboardInventoryCard: React.FC<PodDashboardInventoryCardProps> = () => {
  const podDashboardContext = React.useContext(PodDashboardContext);
  const { pod } = podDashboardContext;

  const isLoading = !pod;

  // initContainers are not included
  const containerCount = getPodContainers(pod).length;
  const volumeCount = getPodVolumes(pod).length;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <InventoryBody>
          <InventoryItem isLoading={isLoading} title="Container" count={containerCount} />
          <InventoryItem isLoading={isLoading} title="Volume" count={volumeCount} />
        </InventoryBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type PodDashboardInventoryCardProps = DashboardItemProps;
