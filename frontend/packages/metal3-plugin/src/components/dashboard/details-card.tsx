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
import { getName, getNamespace } from '@console/shared';
import { K8sResourceKind, MachineKind } from '@console/internal/module/k8s';
import { getHostMachine } from '../../selectors';
import NodeCell from '../NodeCell';
import { BaremetalHostRole } from '../host-role';

const DetailsCard: React.FC<DetailsCardProps> = ({ obj, machines }) => {
  const machine = getHostMachine(obj, machines);
  const hostName = getName(obj);
  const namespace = getNamespace(obj);
  const nodeCell = <NodeCell nodeName={hostName} namespace={namespace} />;
  const hostRole = <BaremetalHostRole machine={machine} />;

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
};
