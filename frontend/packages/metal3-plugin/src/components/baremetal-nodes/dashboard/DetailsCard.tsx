import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import NodeRoles from '@console/app/src/components/nodes/NodeRoles';
import { resourcePathFromModel, ResourceLink } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import { BareMetalHostModel } from '../../../models';
import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';

const DetailsCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(NodeDashboardContext);
  const { host } = React.useContext(BareMetalNodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  return (
    <DashboardCard data-test-id="details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('metal3-plugin~Details')}</DashboardCardTitle>
        <DashboardCardLink to={detailsLink}>{t('metal3-plugin~View all')}</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title={t('metal3-plugin~Node Name')}>
            {obj.metadata.name}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('metal3-plugin~Role')}>
            <NodeRoles node={obj} />
          </DetailItem>
          <DetailItem isLoading={!host} title={t('metal3-plugin~Bare Metal Host')}>
            <ResourceLink
              kind={referenceForModel(BareMetalHostModel)}
              name={host?.metadata?.name}
              namespace={host?.metadata?.namespace}
            />
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('metal3-plugin~Node Addresses')}>
            <NodeIPList ips={getNodeAddresses(obj)} expand />
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default DetailsCard;
