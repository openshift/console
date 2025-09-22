import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, Gallery } from '@patternfly/react-core';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { Status } from '@console/shared';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import {
  DashboardsOverviewHealthResourceSubsystem,
  isDashboardsOverviewHealthResourceSubsystem,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { ProjectDashboardContext } from './project-dashboard-context';
import { ResourceHealthItem } from '../dashboards-page/cluster-dashboard/health-item';

import { DashboardAlerts } from '../dashboards-page/cluster-dashboard/status-card';

export const StatusCard: React.FC = () => {
  const { obj } = React.useContext(ProjectDashboardContext);
  const [subsystemExtensions, extensionsResolved] = useResolvedExtensions<
    DashboardsOverviewHealthResourceSubsystem
  >(isDashboardsOverviewHealthResourceSubsystem);
  const subsystem = React.useMemo(() => {
    const extension = subsystemExtensions.find(
      (s) => s.properties.title === 'Image Vulnerabilities',
    );
    // mimic cluster-dashboard/status-card.tsx as we use a promise here for some reason
    return {
      ...extension,
      properties: {
        ...extension?.properties,
        popupComponent: () => Promise.resolve(extension.properties.popupComponent),
      },
    };
  }, [subsystemExtensions]);
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
                // @ts-expect-error we are providing a promise to the popupComponent
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
