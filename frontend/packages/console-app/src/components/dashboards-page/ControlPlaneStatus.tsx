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
        let icon: React.ReactNode;
        if (health.state === HealthState.LOADING) {
          icon = <div className="skeleton-health" />;
        } else if (health.state !== HealthState.NOT_AVAILABLE) {
          icon = healthStateMapping[health.state].icon;
        }
        return (
          <Status key={titles[index]} title={titles[index]} value={health.message} icon={icon} />
        );
      })}
    </StatusPopupSection>
  </>
);

export default ControlPlanePopup;
