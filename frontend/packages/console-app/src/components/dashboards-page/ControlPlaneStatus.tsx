import * as React from 'react';
import {
  HealthState,
  healthStateMapping,
} from '@console/shared/src/components/dashboard/status-card/states';
import { getControlPlaneComponentHealth } from './status';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { PrometheusHealthPopupProps } from '@console/plugin-sdk';

const titles = ['API Servers', 'Controller Managers', 'Schedulers', 'API Request Success Rate'];

const ControlPlanePopup: React.FC<PrometheusHealthPopupProps> = ({ responses }) => (
  <>
    Components of the Control Plane are responsible for maintaining and reconciling the state of the
    cluster.
    <StatusPopupSection firstColumn="Components" secondColumn="Response rate">
      {responses.map(({ response, error }, index) => {
        const health = getControlPlaneComponentHealth(response, error);
        const icon =
          health.state === HealthState.LOADING ? (
            <div className="skeleton-health" />
          ) : (
            healthStateMapping[health.state].icon
          );
        const value = health.message || healthStateMapping[health.state]?.message;
        return (
          <Status key={titles[index]} value={value} icon={icon}>
            {titles[index]}
          </Status>
        );
      })}
    </StatusPopupSection>
  </>
);

export default ControlPlanePopup;
