import * as React from 'react';
import { Link } from 'react-router-dom';
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
import { findVMIPod } from '../../../selectors/pod/selectors';
import { useGuestAgentInfo } from '../../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { isGuestAgentInstalled } from './vm-alerts';
import { getOperatingSystemName, getOperatingSystem } from '../../../selectors/vm';
import {
  getNumLoggedInUsersMessage,
  getGuestAgentFieldNotAvailMsg,
} from '../../../utils/guest-agent-strings';

export const VMDetailsCard: React.FC<VMDetailsCardProps> = () => {
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, pods, vmStatusBundle } = vmDashboardContext;
  const vmiLike = vm || vmi;
  const { status } = vmStatusBundle;

  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const guestAgentFieldNotAvailMsg = getGuestAgentFieldNotAvailMsg(
    isGuestAgentInstalled(vmi),
    status,
  );

  const launcherPod = findVMIPod(vmi, pods);

  const ipAddrs = getVmiIpAddresses(vmi).join(', ');
  const os = getOperatingSystemName(vmiLike) || getOperatingSystem(vmiLike);

  const name = getName(vmiLike);
  const namespace = getNamespace(vmiLike);
  const nodeName = getVMINodeName(vmi) || getNodeName(launcherPod);

  const viewAllLink = `${resourcePath(
    vm ? VirtualMachineModel.kind : VirtualMachineInstanceModel.kind,
    name,
    namespace,
  )}/${VM_DETAIL_DETAILS_HREF}`;

  // guest agent fields
  const hostname = guestAgentInfo.getHostname();
  const operatingSystem = guestAgentInfo.getOSInfo().getPrettyName();
  const timeZone = guestAgentInfo.getTimezoneName();
  const numLoggedInUsers: number | null = guestAgentInfo.getNumLoggedInUsers();
  const numLoggedInUsersMsg: string = getNumLoggedInUsersMessage(numLoggedInUsers);

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
          <DetailItem
            title="Hostname"
            error={!hostname}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {hostname}
          </DetailItem>
          <DetailItem title="Node" error={!launcherPod || !nodeName} isLoading={!vmiLike}>
            {launcherPod && nodeName && <NodeLink name={nodeName} />}
          </DetailItem>
          <DetailItem
            title="IP Address"
            error={!launcherPod || !ipAddrs}
            isLoading={!vmiLike}
            valueClassName="co-select-to-copy"
          >
            {launcherPod && ipAddrs}
          </DetailItem>
          <DetailItem
            title="Operating System"
            error={!(operatingSystem || os)}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {operatingSystem || os}
          </DetailItem>
          <DetailItem
            title="Time Zone"
            error={!timeZone}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {timeZone}
          </DetailItem>
          <DetailItem
            title="Logged In Users"
            error={numLoggedInUsers == null}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {numLoggedInUsers != null && numLoggedInUsers > 0 ? (
              <Link to={`/k8s/ns/${namespace}/virtualmachines/${name}/details#logged-in-users`}>
                {numLoggedInUsersMsg}
              </Link>
            ) : (
              numLoggedInUsersMsg
            )}
          </DetailItem>
        </DetailsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMDetailsCardProps = DashboardItemProps;
