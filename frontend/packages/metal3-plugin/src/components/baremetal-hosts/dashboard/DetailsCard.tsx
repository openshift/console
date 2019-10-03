import * as React from 'react';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/generic/dashboard-card';
import {
  DetailsBody,
  DetailItem,
} from '@console/internal/components/dashboard/generic/details-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getName, getMachineNode } from '@console/shared';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getHostMachine } from '../../../selectors';
import NodeLink from '../NodeLink';
import BareMetalHostRole from '../BareMetalHostRole';
import { BareMetalHostKind } from '../../../types';

const DetailsCard: React.FC<DetailsCardProps> = ({ obj, machines, nodes }) => {
  const machine = getHostMachine(obj, machines);
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
