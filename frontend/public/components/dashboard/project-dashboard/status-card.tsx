import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, Gallery } from '@patternfly/react-core';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { Status } from '@console/shared';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import {
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthResourceSubsystem,
  isDashboardsOverviewHealthSubsystem,
  useExtensions,
} from '@console/plugin-sdk';
import { ProjectDashboardContext } from './project-dashboard-context';
import { ResourceHealthItem } from '../dashboards-page/cluster-dashboard/health-item';

import { DashboardAlerts } from '../dashboards-page/cluster-dashboard/status-card';

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
  const { t } = useTranslation();

  return (
    <Card data-test-id="status-card" className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('public~Status')}</CardTitle>
      </CardHeader>
      {obj ? (
        <>
          <HealthBody>
            <Gallery className="co-overview-status__health" hasGutter>
              <div className="co-status-card__health-item">
                <Status status={obj.status.phase} className="co-icon-and-text--lg" />
              </div>
              {subsystem && (
                <ResourceHealthItem subsystem={subsystem.properties} namespace={namespace} />
              )}
            </Gallery>
          </HealthBody>
          <DashboardAlerts labelSelector={{ namespace }} />
        </>
      ) : (
        <LoadingInline />
      )}
    </Card>
  );
};
