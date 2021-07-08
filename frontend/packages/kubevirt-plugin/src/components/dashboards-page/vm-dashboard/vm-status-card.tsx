import * as React from 'react';
import { Gallery } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import { VMStatus as VMStatusEnum } from '../../../constants/vm/vm-status';
import { getVMStatusIcon } from '../../vm-status/vm-status';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { VMEventsStatusCard } from '../../vms/VMEventsStatusCard';
import GuestAgentStatusHealth from './status/GuestAgentStatusHealth';
import VMStatusHealth from './status/VMStatusHealth';

import './vm-status-card.scss';

export const VMStatusCard: React.FC<VMStatusCardProps> = () => {
  const { t } = useTranslation();
  const vmDashboardContext = React.useContext(VMDashboardContext);
  const { vm, vmi, vmStatusBundle } = vmDashboardContext;

  const status = vmStatusBundle?.status;
  const isPaused = status === VMStatusEnum.PAUSED;

  const StatusIcon = getVMStatusIcon(isPaused, status, false);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('kubevirt-plugin~Status')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody className="VMStatusCard-body">
        <HealthBody>
          <Gallery className="VMStatusCard co-overview-status__health" hasGutter>
            <VMStatusHealth vmStatusBundle={vmStatusBundle} icon={<StatusIcon />} />
            <GuestAgentStatusHealth vmi={vmi} />
          </Gallery>
        </HealthBody>
        <div className="VMStatusCard-separator" />
        <VMEventsStatusCard vm={vm} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type VMStatusCardProps = DashboardItemProps;
