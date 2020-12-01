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
const rightCards = [{ Card: ActivityCard }];

const HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY = 'console.dashboard.quickStartTile';

export const ClusterDashboard: React.FC<{}> = () => {
  const [infrastructure, infrastructureLoaded, infrastructureError] = useK8sGet<K8sResourceKind>(
    InfrastructureModel,
    'cluster',
  );
  // [TODO](sahil143): use sync capability here
  const [showQuickStartsCatalogCard, , loaded] = useUserSettings(
    HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY,
    true,
  );

  const rc = React.useMemo(
    () =>
      loaded && showQuickStartsCatalogCard
        ? [
            {
              Card: () => (
                <QuickStartsLoader>
                  {(quickStarts) => (
                    <QuickStartsCatalogCard
                      quickStarts={quickStarts}
                      storageKey={HIDE_QUICK_START_DASHBOARD_TILE_STORAGE_KEY}
                      userSettingsKey={HIDE_QUICK_START_DASHBOARD_TILE_USER_SETTINGS_KEY}
                    />
                  )}
                </QuickStartsLoader>
              ),
            },
            ...rightCards,
          ]
        : rightCards,
    [showQuickStartsCatalogCard, loaded],
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
