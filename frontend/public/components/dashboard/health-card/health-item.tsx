import * as React from 'react';
import { Icon } from 'patternfly-react';
import classNames from 'classnames';

import { HealthState } from './states';
import { LoadingInline } from '../../utils';

const HealthItemIcon: React.FC<HealthItemIconProps> = ({ state }) => {
  let icon;
  let iconClassModifier;
  switch (state) {
    case HealthState.OK:
      icon = 'icon-ok';
      iconClassModifier = 'ok';
      break;
    case HealthState.ERROR:
      icon = 'icon-error-circle-o';
      iconClassModifier = 'error';
      break;
    case HealthState.WARNING:
    default:
      icon = 'icon-warning-triangle-o';
      iconClassModifier = 'warning';
  }
  return (
    <div className={`co-health-card__icon co-health-card__icon--${iconClassModifier}`}>
      <Icon type="pf" name={icon} />
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
