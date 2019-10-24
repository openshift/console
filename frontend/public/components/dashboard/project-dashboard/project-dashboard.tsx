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
import { LauncherCard } from './launcher-card';
import { connect } from 'react-redux';
import { getNamespaceDashboardConsoleLinks } from '../../overview/namespace-overview';
import { RootState } from '../../../redux';
import { ResourceQuotaCard } from './resource-quota-card';

const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }, { Card: ResourceQuotaCard }];
const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const rightCards = [{ Card: ActivityCard }];

const mapStateToProps = ({ UI }: RootState): ProjectDashboardReduxProps => ({
  consoleLinks: UI.get('consoleLinks'),
});

const ProjectDashboard_: React.FC<ProjectDashboardReduxProps & ProjectDashboardProps> = ({
  obj,
  consoleLinks,
}) => {
  const namespaceLinks = getNamespaceDashboardConsoleLinks(obj, consoleLinks);
  const context = {
    obj,
    namespaceLinks,
  };

  return (
    <ProjectDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid
          mainCards={mainCards}
          leftCards={leftCards}
          rightCards={namespaceLinks.length ? [{ Card: LauncherCard }, ...rightCards] : rightCards}
        />
      </Dashboard>
    </ProjectDashboardContext.Provider>
  );
};

export const ProjectDashboard = connect<ProjectDashboardReduxProps, {}, ProjectDashboardProps>(
  mapStateToProps,
)(ProjectDashboard_);

type ProjectDashboardReduxProps = {
  consoleLinks: K8sResourceKind[];
};

type ProjectDashboardProps = {
  obj: K8sResourceKind;
};
