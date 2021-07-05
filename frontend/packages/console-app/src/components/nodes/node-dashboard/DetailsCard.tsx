import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/details-card/DetailsBody';
import { getNodeAddresses } from '@console/dynamic-plugin-sdk/src/shared/selectors/node';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
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
        <DashboardCardTitle>{t('nodes~Details')}</DashboardCardTitle>
        <DashboardCardLink to={detailsLink}>{t('nodes~View all')}</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title={t('nodes~Node name')}>
            {obj.metadata.name}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('nodes~Role')}>
            <NodeRoles node={obj} />
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('nodes~Instance type')} error={!instanceType}>
            {instanceType}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('nodes~Zone')} error={!zone}>
            {zone}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('nodes~Node addresses')}>
            <NodeIPList ips={getNodeAddresses(obj)} expand />
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default DetailsCard;
