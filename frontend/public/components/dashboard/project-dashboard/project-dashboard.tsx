import * as React from 'react';

import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { K8sResourceKind } from '../../../module/k8s';
import { DetailsCard } from './details-card';
import { StatusCard } from './status-card';
import { UtilizationCard } from './utilization-card';
import { InventoryCard } from './inventory-card';
import { ActivityCard } from './activity-card';
import { ProjectDashboardContext } from './project-dashboard-context';

const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const rightCards = [{ Card: ActivityCard }];

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ obj }) => {
  const context = {
    obj,
  };

  return (
    <ProjectDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </ProjectDashboardContext.Provider>
  );
};

type ProjectDashboardProps = {
  obj: K8sResourceKind;
};
