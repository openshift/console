import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { Status } from '@console/shared';
import {
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthResourceSubsystem,
  isDashboardsOverviewHealthSubsystem,
  useExtensions,
} from '@console/plugin-sdk';
import { ProjectDashboardContext } from './project-dashboard-context';
import { ResourceHealthItem } from '../dashboards-page/cluster-dashboard/health-item';

import './status-card.scss';

export const StatusCard: React.FC = () => {
  const { obj } = React.useContext(ProjectDashboardContext);
  const filterSubsystems = (subsystems: DashboardsOverviewHealthSubsystem[]) =>
    subsystems.filter(isDashboardsOverviewHealthResourceSubsystem);
  const subsystemExtensions = useExtensions<DashboardsOverviewHealthSubsystem>(
    isDashboardsOverviewHealthSubsystem,
  );
  const subsystem: DashboardsOverviewHealthResourceSubsystem = React.useMemo(
    () =>
      filterSubsystems(subsystemExtensions).find(
        (s) => s.properties.title === 'Image Vulnerabilities',
      ),
    [subsystemExtensions],
  );
  const {
    metadata: { name: namespace },
  } = obj;

  return (
    <DashboardCard gradient data-test-id="status-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={!obj}>
        <HealthBody>
          <div className="co-project-dashboard__status">
            <Status status={obj.status.phase} />
          </div>
          {subsystem && (
            <ResourceHealthItem subsystem={subsystem.properties} namespace={namespace} />
          )}
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};
