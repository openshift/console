import * as React from 'react';

import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';

import { StoragePoolKind } from 'packages/ceph-storage-plugin/src/types';
import { BlockPoolDashboardContext } from './block-pool-dashboard-context';
import { DetailsCard } from './details-card';
import { InventoryCard } from './inventory-card';
import { StatusCard } from './status-card';
import { RawCapacityCard } from './raw-capacity-card';
import { UtilizationCard } from './utilization-card';
import { MirroringCard } from './mirroring-card';
import { CompressionDetailsCard } from './compression-details-card';

const leftCards = [
  { Card: DetailsCard },
  { Card: InventoryCard },
  { Card: CompressionDetailsCard },
];
const mainCards = [{ Card: StatusCard }, { Card: RawCapacityCard }, { Card: UtilizationCard }];
const rightCards = [{ Card: MirroringCard }];

export const BlockPoolDashboard: React.FC<PoolDashboardProps> = ({ obj }) => {
  return (
    <BlockPoolDashboardContext.Provider value={{ obj }}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </BlockPoolDashboardContext.Provider>
  );
};

type PoolDashboardProps = {
  obj: StoragePoolKind;
};
