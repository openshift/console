import { useContext, useMemo, memo } from 'react';
import { Card, CardHeader, CardTitle, Gallery } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { DashboardsOverviewHealthResourceSubsystem } from '@console/dynamic-plugin-sdk';
import {
  isDashboardsOverviewHealthResourceSubsystem,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { Status } from '@console/shared/src/components/status/Status';
import { ResourceHealthItem } from '../dashboards-page/cluster-dashboard/health-item';
import { DashboardNamespacedAlerts } from '../dashboards-page/cluster-dashboard/status-card';
import { ProjectDashboardContext } from './project-dashboard-context';

export const StatusCard = memo(() => {
  const { obj } = useContext(ProjectDashboardContext);
  const [subsystemExtensions, extensionsResolved] = useResolvedExtensions<
    DashboardsOverviewHealthResourceSubsystem
  >(isDashboardsOverviewHealthResourceSubsystem);
  const subsystem = useMemo(
    () => subsystemExtensions.find((s) => s.properties.title === 'Image Vulnerabilities'),
    [subsystemExtensions],
  );
  const namespace = obj?.metadata?.name;
  const { t } = useTranslation('public');

  return (
    <Card data-test="status-card" data-test-id="status-card">
      <CardHeader>
        <CardTitle>{t('Status')}</CardTitle>
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
});
