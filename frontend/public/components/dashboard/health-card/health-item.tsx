import * as React from 'react';
import classNames from 'classnames';

import { HealthState } from './states';
import {
  GreenCheckCircleIcon,
  LoadingInline,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '../../utils';

const HealthItemIcon: React.FC<HealthItemIconProps> = ({ state }) => {
  let icon;
  switch (state) {
    case HealthState.OK:
      icon = <GreenCheckCircleIcon />;
      break;
    case HealthState.ERROR:
      icon = <RedExclamationCircleIcon />;
      break;
    case HealthState.WARNING:
    default:
      icon = <YellowExclamationTriangleIcon />;
  }
  return (
    <div className="co-health-card__icon">
      {icon}
    </div>
  );
};

export const HealthItem: React.FC<HealthItemProps> = React.memo(({ className, state, message, details }) => (
  <div className={classNames('co-health-card__item', className)}>
    {state === HealthState.LOADING ? <LoadingInline /> : <HealthItemIcon state={state} />}
    <div>
      {message && <span className="co-health-card__text">{message}</span>}
      {details && <div className="co-health-card__text co-health-card__subtitle">{details}</div>}
    </div>
  </div>
));

type HealthItemProps = {
  className?: string;
  message?: string;
  details?: string;
  state?: HealthState;
};

type HealthItemIconProps = {
  state?: HealthState;
}
