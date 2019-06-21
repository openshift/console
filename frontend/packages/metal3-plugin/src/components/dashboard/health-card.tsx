import * as React from 'react';

import { DashboardItemProps } from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { HealthBody } from '@console/internal/components/dashboard/health-card/health-body';
import { HealthItem } from '@console/internal/components/dashboard/health-card/health-item';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';

import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  HOST_STATUS_OK,
  HOST_HEALTH_OK,
  HOST_STATUS_ERROR,
  HOST_HEALTH_ERROR,
  HOST_HEALTH_LOADING,
} from '../../constants';
import { getHostOperationalStatus } from '../../selectors';

const getHostHealthState = (obj): HostHealthState => {
  const status = getHostOperationalStatus(obj);

  switch (status) {
    case HOST_STATUS_OK:
      return {
        state: HealthState.OK,
        message: HOST_HEALTH_OK,
      };
    case HOST_STATUS_ERROR:
      return {
        state: HealthState.ERROR,
        message: HOST_HEALTH_ERROR,
      };
    default:
      return {
        state: HealthState.LOADING,
        message: HOST_HEALTH_LOADING,
      };
  }
};

export const HealthCard: React.FC<HealthCardProps> = ({ obj }) => {
  const health = getHostHealthState(obj);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Health</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <HealthItem state={health.state} message={health.message} />
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type HostHealthState = {
  state: HealthState;
  message: string;
};

type HealthCardProps = DashboardItemProps & {
  obj: K8sResourceKind;
};
