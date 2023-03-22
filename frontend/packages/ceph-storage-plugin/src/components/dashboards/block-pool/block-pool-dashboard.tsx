import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';

import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { labelForNodeKind, labelKeyForNodeKind } from '@console/shared';

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
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title data-title-id={`${labelForNodeKind(obj.kind)} · Overview`}>
          {obj.metadata.name}
          {' · '} {t(labelKeyForNodeKind(obj.kind))}
          {' · '} {t('ceph-storage-plugin~Overview')}
        </title>
      </Helmet>
      <BlockPoolDashboardContext.Provider value={{ obj }}>
        <Dashboard>
          <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
        </Dashboard>
      </BlockPoolDashboardContext.Provider>
    </>
  );
};

type PoolDashboardProps = {
  obj: StoragePoolKind;
};
