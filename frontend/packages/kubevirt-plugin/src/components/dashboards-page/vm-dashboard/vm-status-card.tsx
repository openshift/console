import * as React from 'react';
import { Gallery, Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
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
  const StatusIcon = getVMStatusIcon(status, false);

  return (
    <Card className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('kubevirt-plugin~Status')}</CardTitle>
      </CardHeader>
      <CardBody className="VMStatusCard-body">
        <HealthBody>
          <Gallery className="VMStatusCard co-overview-status__health" hasGutter>
            <VMStatusHealth vmStatusBundle={vmStatusBundle} icon={<StatusIcon />} />
            <GuestAgentStatusHealth vmi={vmi} />
          </Gallery>
        </HealthBody>
        <div className="VMStatusCard-separator" />
        <VMEventsStatusCard vm={vm} />
      </CardBody>
    </Card>
  );
};

type VMStatusCardProps = DashboardItemProps;
