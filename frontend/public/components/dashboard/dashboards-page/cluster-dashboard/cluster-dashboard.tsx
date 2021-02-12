import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { HIDE_QUICK_START_DASHBOARD_TILE_STORAGE_KEY } from '@console/shared/src/components/quick-starts/quick-starts-catalog-card-constants';
import QuickStartsCatalogCard from '@console/shared/src/components/quick-starts/QuickStartsCatalogCard';
import { QuickStart } from '@console/app/src/components/quick-starts/utils/quick-start-types';
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

const HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY = 'console.dashboard.quickStartTile';

interface ClusterDashboardProps {
  quickStarts: QuickStart[];
}

export const ClusterDashboard: React.FC<ClusterDashboardProps> = ({ quickStarts }) => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );

  const [showQSTile, setShowQSTile] = React.useState<boolean>(true);
  const rc = React.useMemo(
    () =>
      showQSTile && quickStarts?.length > 0
        ? [
            {
              Card: () => (
                <QuickStartsCatalogCard
                  quickStarts={quickStarts}
                  storageKey={HIDE_QUICK_START_DASHBOARD_TILE_STORAGE_KEY}
                  userSettingsKey={HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY}
                  shouldShowQSTile={setShowQSTile}
                />
              ),
            },
            ...rightCards,
          ]
        : rightCards,
    [quickStarts, showQSTile],
  );

  const context = {
    infrastructure,
    infrastructureLoaded,
    infrastructureError,
  };

  return (
    <ClusterDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rc} />
      </Dashboard>
    </ClusterDashboardContext.Provider>
  );
};
