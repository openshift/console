import * as React from 'react';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import {
  NodeLink,
  ResourceLink,
  resourcePath,
  Timestamp,
} from '@console/internal/components/utils';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { VM_DETAIL_DETAILS_HREF } from '../../../constants';
import { useGuestAgentInfo } from '../../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import {
  getCreationTimestamp,
  getName,
  getNamespace,
  getNodeName,
  getUID,
} from '../../../selectors';
import { findVMIPod } from '../../../selectors/pod/selectors';
import { getOperatingSystem, getOperatingSystemName } from '../../../selectors/vm/selectors';
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
    vm
      ? kubevirtReferenceForModel(VirtualMachineModel)
      : kubevirtReferenceForModel(VirtualMachineInstanceModel),
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
    <Card isClickable isSelectable>
      <CardHeader
        actions={{
          actions: (
            <>
              <Link to={viewAllLink}>View all</Link>
            </>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{t('kubevirt-plugin~Details')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DetailsBody>
          <OverviewDetailItem
            title={t('kubevirt-plugin~Name')}
            isLoading={!vmiLike}
            valueClassName="co-select-to-copy"
          >
            {name}
          </OverviewDetailItem>
          <OverviewDetailItem title={t('kubevirt-plugin~Namespace')} isLoading={!vmiLike}>
            <ResourceLink
              kind="Namespace"
              name={namespace}
              title={getUID(vmiLike)}
              namespace={null}
            />
          </OverviewDetailItem>
          <OverviewDetailItem title={t('kubevirt-plugin~Created')} isLoading={!vmiLike}>
            <Timestamp timestamp={getCreationTimestamp(vmiLike)} />
          </OverviewDetailItem>
          <OverviewDetailItem
            title={t('kubevirt-plugin~Hostname')}
            error={!hostname ? guestAgentFieldNotAvailMsg : undefined}
            isLoading={!vmiLike}
          >
            {hostname}
          </OverviewDetailItem>
          <OverviewDetailItem
            title={t('kubevirt-plugin~Node')}
            error={!launcherPod || !nodeName ? t('kubevirt-plugin~Not available') : undefined}
            isLoading={!vmiLike}
          >
            {launcherPod && nodeName && <NodeLink name={nodeName} />}
          </OverviewDetailItem>
          <OverviewDetailItem
            title={t('kubevirt-plugin~IP Address')}
            error={!launcherPod || !ipAddrs ? t('kubevirt-plugin~Not available') : undefined}
            isLoading={!vmiLike}
            valueClassName="co-select-to-copy"
          >
            {launcherPod && ipAddrs && <VMIP data={ipAddrs} />}
          </OverviewDetailItem>
          <OverviewDetailItem
            title={t('kubevirt-plugin~Operating System')}
            error={!(operatingSystem || os) ? guestAgentFieldNotAvailMsg : undefined}
            isLoading={!vmiLike}
          >
            {operatingSystem || os}
          </OverviewDetailItem>
          <OverviewDetailItem
            title={t('kubevirt-plugin~Time Zone')}
            error={!timeZone ? guestAgentFieldNotAvailMsg : undefined}
            isLoading={!vmiLike}
          >
            {timeZone}
          </OverviewDetailItem>
          <OverviewDetailItem
            title={t('kubevirt-plugin~Active Users')}
            error={numLoggedInUsers == null ? guestAgentFieldNotAvailMsg : undefined}
            isLoading={!vmiLike}
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
          </OverviewDetailItem>
        </DetailsBody>
      </CardBody>
    </Card>
  );
};

type VMDetailsCardProps = DashboardItemProps;
