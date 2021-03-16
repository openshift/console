import * as React from 'react';
import { Link } from 'react-router-dom';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import InventoryItem from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { PodModel, NodeModel } from '@console/internal/models';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import { NodeInventoryItem } from '@console/app/src/components/nodes/node-dashboard/InventoryCard';
import { resourcePathFromModel } from '@console/internal/components/utils';

import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';
import { getHostStorage, getHostNICs, getHostCPU } from '../../../selectors';

import { useTranslation } from 'react-i18next';

const InventoryCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { host } = React.useContext(BareMetalNodeDashboardContext);

  const NICTitleComponent = React.useCallback(({ children }) => <Link to={`${resourcePathFromModel(NodeModel, obj.metadata.name)}/nics`}>{children}</Link>, [obj.metadata.name]);

  const DiskTitleComponent = React.useCallback(({ children }) => <Link to={`${resourcePathFromModel(NodeModel, obj.metadata.name)}/disks`}>{children}</Link>, [obj.metadata.name]);
  const { t } = useTranslation();
  return (
    <DashboardCard data-test-id="inventory-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('SINGLE:MSG_OVERVIEW_MAIN_CARDINVENTORY_1')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <NodeInventoryItem nodeName={obj.metadata.name} model={PodModel} mapper={getPodStatusGroups} />
        <InventoryItem isLoading={!obj} title={t('SINGLE:MSG_OVERVIEW_MAIN_CARDINVENTORY_3')} titlePlural="Images" count={obj.status?.images?.length} error={!obj.status?.images} />
        <InventoryItem title={t('SINGLE:MSG_OVERVIEW_MAIN_CARDINVENTORY_4')} isLoading={!obj} count={getHostStorage(host).length} TitleComponent={DiskTitleComponent} />
        <InventoryItem title={t('SINGLE:MSG_OVERVIEW_MAIN_CARDINVENTORY_5')} isLoading={!obj} count={getHostNICs(host).length} TitleComponent={NICTitleComponent} />
        <InventoryItem title={t('SINGLE:MSG_OVERVIEW_MAIN_CARDINVENTORY_6')} isLoading={!obj} count={getHostCPU(host).count} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default InventoryCard;
