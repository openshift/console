import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import {
  NodeLink,
  ResourceLink,
  resourcePath,
  Timestamp,
} from '@console/internal/components/utils';
import { getCreationTimestamp, getName, getNamespace, getNodeName, getUID } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';

import { VM_DETAIL_DETAILS_HREF } from '../../../constants';
import { useGuestAgentInfo } from '../../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../../models';
import { findVMIPod } from '../../../selectors/pod/selectors';
import { getOperatingSystem, getOperatingSystemName } from '../../../selectors/vm';
import { getVmiIpAddresses, getVMINodeName } from '../../../selectors/vmi';
import {
  getGuestAgentFieldNotAvailMsg,
  getNumLoggedInUsersMessage,
} from '../../../utils/guest-agent-strings';
import { isGuestAgentInstalled } from '../../../utils/guest-agent-utils';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import VMIP from '../../vms/VMIP';

export const VMDetailsCard: React.FC<VMDetailsCardProps> = () => {
  const { t } = useTranslation();
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, pods, vmStatusBundle } = vmDashboardContext;
  const vmiLike = vm || vmi;
  const { status } = vmStatusBundle;

  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const guestAgentFieldNotAvailMsg = getGuestAgentFieldNotAvailMsg(
    t,
    isGuestAgentInstalled(vmi),
    status,
  );

  const launcherPod = findVMIPod(vmi, pods);

  const ipAddrs = getVmiIpAddresses(vmi);
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
  const numLoggedInUsersMsg: string = getNumLoggedInUsersMessage(t, numLoggedInUsers);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('kubevirt-plugin~Details')}</DashboardCardTitle>
        <DashboardCardLink to={viewAllLink}>View all</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={false}>
        <DetailsBody>
          <DetailItem
            title={t('kubevirt-plugin~Name')}
            error={false}
            isLoading={!vmiLike}
            valueClassName="co-select-to-copy"
          >
            {name}
          </DetailItem>
          <DetailItem title={t('kubevirt-plugin~Namespace')} error={false} isLoading={!vmiLike}>
            <ResourceLink
              kind="Namespace"
              name={namespace}
              title={getUID(vmiLike)}
              namespace={null}
            />
          </DetailItem>
          <DetailItem title={t('kubevirt-plugin~Created')} error={false} isLoading={!vmiLike}>
            <Timestamp timestamp={getCreationTimestamp(vmiLike)} />
          </DetailItem>
          <DetailItem
            title={t('kubevirt-plugin~Hostname')}
            error={!hostname}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {hostname}
          </DetailItem>
          <DetailItem
            title={t('kubevirt-plugin~Node')}
            error={!launcherPod || !nodeName}
            isLoading={!vmiLike}
          >
            {launcherPod && nodeName && <NodeLink name={nodeName} />}
          </DetailItem>
          <DetailItem
            title={t('kubevirt-plugin~IP Address')}
            error={!launcherPod || !ipAddrs}
            isLoading={!vmiLike}
            valueClassName="co-select-to-copy"
          >
            {launcherPod && ipAddrs && <VMIP data={ipAddrs} />}
          </DetailItem>
          <DetailItem
            title={t('kubevirt-plugin~Operating System')}
            error={!(operatingSystem || os)}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {operatingSystem || os}
          </DetailItem>
          <DetailItem
            title={t('kubevirt-plugin~Time Zone')}
            error={!timeZone}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {timeZone}
          </DetailItem>
          <DetailItem
            title={t('kubevirt-plugin~Active Users')}
            error={numLoggedInUsers == null}
            isLoading={!vmiLike}
            errorMessage={guestAgentFieldNotAvailMsg}
          >
            {numLoggedInUsers != null && numLoggedInUsers > 0 ? (
              <Link
                to={`/k8s/ns/${namespace}/virtualmachines/${name}/details#logged-in-users`}
                id="num-active-users-message"
              >
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
