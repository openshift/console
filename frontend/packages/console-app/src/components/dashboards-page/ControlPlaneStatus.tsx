import * as React from 'react';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  RedExclamationCircleIcon,
} from '@console/shared';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getControlPlaneComponentHealth } from './status';

const ResponseRate: React.FC<ResponseRateProps> = ({ response, children, error }) => {
  const health = getControlPlaneComponentHealth(response, error);
  let icon: React.ReactNode;
  if (health.state === HealthState.LOADING) {
    icon = <div className="skeleton-health" />;
  } else if (health.state === HealthState.OK) {
    icon = <GreenCheckCircleIcon />;
  } else if (health.state === HealthState.WARNING) {
    icon = <YellowExclamationTriangleIcon />;
  } else if (health.state === HealthState.ERROR) {
    icon = <RedExclamationCircleIcon />;
  }
  return (
    <div className="co-overview-status__row">
      <div>{children}</div>
      <div className="co-overview-status__response-rate">
        <div className="text-secondary">{health.message}</div>
        {icon && <div className="co-overview-status__response-rate-icon">{icon}</div>}
      </div>
    </div>
  );
};

const ControlPlanePopup: React.FC<ControlPlanePopupProps> = ({ results, errors }) => (
  <>
    <div className="co-overview-status__control-plane-description">
      Components of the Control Plane are responsible for maintaining and reconcilling the state of
      the cluster.
    </div>
    <div className="co-overview-status__row">
      <div className="co-overview-status__text--bold">Components</div>
      <div className="text-secondary">Response rate</div>
    </div>
    <ResponseRate response={results[0]} error={errors[0]}>
      API Servers
    </ResponseRate>
    <ResponseRate response={results[1]} error={errors[1]}>
      Controller Managers
    </ResponseRate>
    <ResponseRate response={results[2]} error={errors[2]}>
      Schedulers
    </ResponseRate>
    <ResponseRate response={results[3]} error={errors[3]}>
      API Request Success Rate
    </ResponseRate>
  </>
);

export default ControlPlanePopup;

type ControlPlanePopupProps = {
  results: PrometheusResponse[];
  errors: any[];
};

type ResponseRateProps = {
  response: PrometheusResponse;
  children: React.ReactNode;
  error: any;
};
