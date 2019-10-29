import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getName, getMachineNode } from '@console/shared';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import NodeLink from '../NodeLink';
import BareMetalHostRole from '../BareMetalHostRole';
import { BareMetalHostKind } from '../../../types';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const DetailsCard: React.FC<DetailsCardProps> = () => {
  const { obj, machine, nodes } = React.useContext(BareMetalHostDashboardContext);
  const node = getMachineNode(machine, nodes);
  const hostName = getName(obj);
  const nodeCell = <NodeLink nodeName={hostName} />;
  const hostRole = <BareMetalHostRole machine={machine} node={node} />;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
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

export default withDashboardResources(DetailsCard);

type DetailsCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};
