import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { StatusCard } from './status-card';
import { DetailsCard } from './details-card';
import { InventoryCard } from './inventory-card';
import { UtilizationCard } from './utilization-card';
import { ActivityCard } from './activity-card';
import { useK8sGet } from '../../../utils/k8s-get-hook';
import { InfrastructureModel } from '../../../../models';
import { K8sResourceKind } from '../../../../module/k8s';
import { ClusterDashboardContext } from './context';

import { GettingStartedSection } from './getting-started/getting-started-section';
import { CLUSTER_DASHBOARD_USER_SETTINGS_KEY } from './getting-started/constants';

const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const rightCards = [{ Card: ActivityCard }];

export const ClusterDashboard: React.FC<{}> = () => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );

  const consoleCapabilityGettingStartedBannerIsEnabled = useFlag(
    FLAGS.CONSOLE_CAPABILITY_GETTINGSTARTEDBANNER_IS_ENABLED,
  );

  const context = {
    infrastructure,
    infrastructureLoaded,
    infrastructureError,
  };

  return (
    <ClusterDashboardContext.Provider value={context}>
      <Dashboard>
        {consoleCapabilityGettingStartedBannerIsEnabled && (
          <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />
        )}
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </ClusterDashboardContext.Provider>
  );
};
