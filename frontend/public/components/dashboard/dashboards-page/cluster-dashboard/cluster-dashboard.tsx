import * as React from 'react';
import { useUserSettings } from '@console/shared';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import { HIDE_QUICK_START_DASHBOARD_TILE_STORAGE_KEY } from '@console/shared/src/components/quick-starts/quick-starts-catalog-card-constants';
import QuickStartsCatalogCard from '@console/shared/src/components/quick-starts/QuickStartsCatalogCard';
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

const HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY = 'console.dashboard.quickStartTile';

export const ClusterDashboard: React.FC<{}> = () => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );

  const [hasQuickStarts, setHasQuickStarts] = React.useState<boolean>(true);

  const [showQuickStartsCatalogCard, , loaded] = useUserSettings(
    HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY,
    true,
    true,
  );

  const rightCards = React.useMemo(
    () => [
      {
        loaded: loaded && showQuickStartsCatalogCard && hasQuickStarts,
        Card: () => (
          <QuickStartsLoader>
            {(quickStarts, quickStartsLoaded) => {
              if (quickStartsLoaded && quickStarts.length === 0 && hasQuickStarts === true) {
                setHasQuickStarts(false);
              } else if (quickStartsLoaded && quickStarts.length > 0 && hasQuickStarts === false) {
                setHasQuickStarts(true);
              }
              return (
                <QuickStartsCatalogCard
                  quickStarts={quickStarts}
                  storageKey={HIDE_QUICK_START_DASHBOARD_TILE_STORAGE_KEY}
                  userSettingsKey={HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY}
                />
              );
            }}
          </QuickStartsLoader>
        ),
      },
      { Card: ActivityCard },
    ],
    [showQuickStartsCatalogCard, loaded, hasQuickStarts],
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
