import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import NodeIPList from '../NodeIPList';
import NodeRoles from '../NodeRoles';
import { NodeDashboardContext } from './NodeDashboardContext';

const DetailsCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  const instanceType = obj.metadata.labels?.['beta.kubernetes.io/instance-type'];
  const zone = obj.metadata.labels?.['topology.kubernetes.io/zone'];
  const { t } = useTranslation();
  return (
    <DashboardCard data-test-id="details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('console-app~Details')}</DashboardCardTitle>
        <DashboardCardLink to={detailsLink}>{t('console-app~View all')}</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title={t('console-app~Node name')}>
            {obj.metadata.name}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('console-app~Role')}>
            <NodeRoles node={obj} />
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('console-app~Instance type')} error={!instanceType}>
            {instanceType}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('console-app~Zone')} error={!zone}>
            {zone}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('console-app~Node addresses')}>
            <NodeIPList ips={getNodeAddresses(obj)} expand />
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default DetailsCard;
