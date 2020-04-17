import * as React from 'react';

import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { StatusCard } from './status-card';
import { DetailsCard } from './details-card';
import { InventoryCard } from './inventory-card';
import { UtilizationCard } from './utilization-card';
import { ActivityCard } from './activity-card';
import { useK8sGet } from '../../../utils/k8s-get-hook';
import { InfrastructureModel } from '../../../../models';
import { K8sResourceKind } from '../../../../module/k8s';
import { ClusterDashboardContext } from './context';

const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const rightCards = [{ Card: ActivityCard }];

export const ClusterDashboard: React.FC<{}> = () => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );

  const context = {
    infrastructure,
    infrastructureLoaded,
    infrastructureError,
  };

  return (
    <ClusterDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </ClusterDashboardContext.Provider>
  );
};
