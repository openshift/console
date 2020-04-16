import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import { resourcePathFromModel, ResourceLink } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import NodeRoles from '@console/app/src/components/nodes/NodeRoles';

import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';
import { BareMetalHostModel } from '../../../models';

const DetailsCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { host } = React.useContext(BareMetalNodeDashboardContext);
  const detailsLink = `${resourcePathFromModel(NodeModel, obj.metadata.name)}/details`;
  return (
    <DashboardCard data-test-id="details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
        <DashboardCardLink to={detailsLink}>View all</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title="Node Name">
            {obj.metadata.name}
          </DetailItem>
          <DetailItem isLoading={!obj} title="Role">
            <NodeRoles node={obj} />
          </DetailItem>
          <DetailItem isLoading={!host} title="Bare Metal Host">
            <ResourceLink
              kind={referenceForModel(BareMetalHostModel)}
              name={host?.metadata?.name}
              namespace={host?.metadata?.namespace}
            />
          </DetailItem>
          <DetailItem isLoading={!obj} title="Node Addresses">
            <NodeIPList ips={getNodeAddresses(obj)} expand />
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default DetailsCard;
