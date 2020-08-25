import * as React from 'react';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import {
  healthStateMapping,
  HealthState,
} from '@console/shared/src/components/dashboard/status-card/states';
import { SubsystemHealth } from '@console/plugin-sdk';
import { getWorstStatus } from '@console/app/src/components/dashboards-page/status';
import { StatusType, healthString, dataResiliency } from '../../constants';

type ObjectServiceStatusProps = {
  RGWMetrics: SubsystemHealth;
  MCGMetrics: SubsystemHealth;
  statusType: StatusType;
};

export const ObjectServiceStatus: React.FC<ObjectServiceStatusProps> = ({
  RGWMetrics,
  MCGMetrics,
  statusType,
}) => {
  const isMissing = !(RGWMetrics && MCGMetrics);
  const title = statusType === StatusType.HEALTH ? 'Object Service' : 'Data Resiliency';
  const popupTitle = statusType === StatusType.HEALTH ? 'Object Service Status' : 'Data Resiliency';
  const { state = HealthState.LOADING, message = '' } = !isMissing
    ? getWorstStatus([RGWMetrics, MCGMetrics])
    : {};
  return isMissing ? (
    <HealthItem
      title={title}
      state={RGWMetrics?.state || MCGMetrics?.state}
      details={RGWMetrics?.message || MCGMetrics?.message}
    />
  ) : (
    <HealthItem title={title} state={state} details={message} popupTitle={popupTitle}>
      {statusType === StatusType.HEALTH ? healthString : dataResiliency}
      <StatusPopupSection firstColumn="Services" secondColumn="Status">
        <Status icon={healthStateMapping[MCGMetrics.state]?.icon}>Multi Cloud Gateway </Status>
        <Status icon={healthStateMapping[RGWMetrics.state]?.icon}>Object Gateway (RGW) </Status>
      </StatusPopupSection>
    </HealthItem>
  );
};
