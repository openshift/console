import * as React from 'react';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import { DetailsBody, DetailItem } from '@console/internal/components/dashboard/details-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { getName, getMachineNode } from '@console/shared';
import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { getHostMachine } from '../../../selectors';
import NodeLink from '../NodeLink';
import BareMetalHostRole from '../BareMetalHostRole';

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
  obj: K8sResourceKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};
