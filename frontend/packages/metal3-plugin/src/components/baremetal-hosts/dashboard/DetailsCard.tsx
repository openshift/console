import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import { getName, getNamespace } from '@console/shared';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils';
import NodeLink from '../NodeLink';
import BareMetalHostRole from '../BareMetalHostRole';
import { BareMetalHostKind } from '../../../types';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const DetailsCard: React.FC<DetailsCardProps> = () => {
  const { obj, machine, node } = React.useContext(BareMetalHostDashboardContext);
  const hostName = getName(obj);
  const nodeCell = <NodeLink nodeName={getName(node)} />;
  const hostRole = <BareMetalHostRole machine={machine} node={node} />;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
        <DashboardCardLink
          to={`${resourcePathFromModel(
            BareMetalHostModel,
            getName(obj),
            getNamespace(obj),
          )}/details`}
        >
          View all
        </DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem title="Host name" isLoading={false} error={null}>
            {hostName}
          </DetailItem>
          <DetailItem title="Role" isLoading={false} error={null}>
            {hostRole}
          </DetailItem>
          <DetailItem title="Node" isLoading={false} error={null}>
            {nodeCell}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default DetailsCard;

type DetailsCardProps = {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};
