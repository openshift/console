import * as React from 'react';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import { getName, getNamespace, getUID, getCreationTimestamp, getNodeName } from '@console/shared';
import {
  ResourceLink,
  Timestamp,
  NodeLink,
  resourcePath,
} from '@console/internal/components/utils';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { VirtualMachineModel, VirtualMachineInstanceModel } from '../../../models';
import { getVmiIpAddresses, getVMINodeName } from '../../../selectors/vmi';
import { VM_DETAIL_DETAILS_HREF } from '../../../constants';
import { findVMPod } from '../../../selectors/pod/selectors';

export const VMDetailsCard: React.FC<VMDetailsCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, pods } = vmDashboardContext;
  const vmiLike = vm || vmi;

  const launcherPod = findVMPod(vmi, pods);

  const ipAddrs = getVmiIpAddresses(vmi).join(', ');

  const isNodeLoading = !vmiLike || !pods;
  const name = getName(vmiLike);
  const namespace = getNamespace(vmiLike);
  const nodeName = getVMINodeName(vmi) || getNodeName(launcherPod);

  const viewAllLink = `${resourcePath(
    vm ? VirtualMachineModel.kind : VirtualMachineInstanceModel.kind,
    name,
    namespace,
  )}/${VM_DETAIL_DETAILS_HREF}`;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Details</DashboardCardTitle>
        <DashboardCardLink to={viewAllLink}>View all</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={false}>
        <DetailsBody>
          <DetailItem
            title="Name"
            error={false}
            isLoading={!vmiLike}
            valueClassName="co-select-to-copy"
          >
            {name}
          </DetailItem>
          <DetailItem title="Namespace" error={false} isLoading={!vmiLike}>
            <ResourceLink
              kind="Namespace"
              name={namespace}
              title={getUID(vmiLike)}
              namespace={null}
            />
          </DetailItem>
          <DetailItem title="Created" error={false} isLoading={!vmiLike}>
            <Timestamp timestamp={getCreationTimestamp(vmiLike)} />
          </DetailItem>
          <DetailItem title="Node" error={!isNodeLoading && !nodeName} isLoading={isNodeLoading}>
            {nodeName && <NodeLink name={nodeName} />}
          </DetailItem>
          <DetailItem
            title="IP Address"
            error={!launcherPod || !ipAddrs}
            isLoading={!vmiLike}
            valueClassName="co-select-to-copy"
          >
            {launcherPod && ipAddrs}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMDetailsCardProps = DashboardItemProps;
