import {
  DashboardsOverviewHealthResourceSubsystem,
  isDashboardsOverviewHealthResourceSubsystem,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { Status } from '@console/shared/src/components/status/Status';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { Card, CardHeader, CardTitle, Gallery } from '@patternfly/react-core';
import type { FC } from 'react';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceHealthItem } from '../dashboards-page/cluster-dashboard/health-item';
import { ProjectDashboardContext } from './project-dashboard-context';

import { DashboardNamespacedAlerts } from '../dashboards-page/cluster-dashboard/status-card';

export const StatusCard: FC = () => {
  const { obj } = useContext(ProjectDashboardContext);
  const [subsystemExtensions, extensionsResolved] = useResolvedExtensions<
    DashboardsOverviewHealthResourceSubsystem
  >(isDashboardsOverviewHealthResourceSubsystem);
  const subsystem = useMemo(
    () => subsystemExtensions.find((s) => s.properties.title === 'Image Vulnerabilities'),
    [subsystemExtensions],
  );
  const {
    metadata: { name: namespace },
  } = obj;
  const { t } = useTranslation();

  return (
    <Card data-test-id="status-card">
      <CardHeader>
        <CardTitle>{t('public~Status')}</CardTitle>
      </CardHeader>
      {obj ? (
        <>
          <HealthBody>
            <Gallery className="co-overview-status__health" hasGutter>
              <div className="co-status-card__health-item" data-test="project-status">
                <Status status={obj.status?.phase} className="co-icon-and-text--lg" />
              </div>
              {subsystem && extensionsResolved && (
                <ResourceHealthItem subsystem={subsystem.properties} namespace={namespace} />
              )}
            </Gallery>
          </HealthBody>
          {namespace && <DashboardNamespacedAlerts namespace={namespace} />}
        </>
      ) : (
        <LoadingInline />
      )}
    </Card>
  );
};
