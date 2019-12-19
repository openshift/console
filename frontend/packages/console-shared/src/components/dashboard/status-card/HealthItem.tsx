import * as React from 'react';
import classNames from 'classnames';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { InProgressIcon, SyncAltIcon, UnknownIcon } from '@patternfly/react-icons';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';
import { HealthState } from './states';

const healthStateMapping = {
  [HealthState.OK]: {
    icon: <GreenCheckCircleIcon />,
  },
  [HealthState.ERROR]: {
    icon: <RedExclamationCircleIcon />,
  },
  [HealthState.WARNING]: {
    icon: <YellowExclamationTriangleIcon />,
    message: 'Degraded',
  },
  [HealthState.UPDATING]: {
    icon: <SyncAltIcon className="update-pending" />,
    message: 'Updating',
  },
  [HealthState.PROGRESS]: {
    icon: <InProgressIcon />,
  },
  [HealthState.UNKNOWN]: {
    icon: <UnknownIcon className="text-secondary" />,
    message: 'Not available',
  },
};

const HealthItemIcon: React.FC<HealthItemIconProps> = ({ state }) => (
  <div className="co-dashboard-icon">
    {(healthStateMapping[state] || healthStateMapping[HealthState.UNKNOWN]).icon}
  </div>
);

const HealthItem: React.FC<HealthItemProps> = React.memo(
  ({ className, state, title, details, popupTitle, PopupComponent }) => {
    const detailMessage =
      details || (healthStateMapping[state] || healthStateMapping[HealthState.UNKNOWN]).message;
    return (
      <div className={classNames('co-status-card__health-item', className)}>
        {state === HealthState.LOADING ? (
          <div className="skeleton-health" />
        ) : (
          <HealthItemIcon state={state} />
        )}
        <div>
          <span className="co-dashboard-text--small co-status-card__health-item-text">
            {PopupComponent && state !== HealthState.LOADING ? (
              <DashboardCardPopupLink
                linkTitle={title}
                popupTitle={popupTitle}
                className="co-status-card__popup"
              >
                <PopupComponent />
              </DashboardCardPopupLink>
            ) : (
              title
            )}
          </span>
          {state !== HealthState.LOADING && detailMessage && (
            <div className="co-dashboard-text--small co-status-card__health-item-text co-status-card__health-item-subtitle">
              {detailMessage}
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default HealthItem;

type HealthItemProps = {
  title: string;
  className?: string;
  details?: string;
  state?: HealthState;
  PopupComponent?: React.ComponentType<any>;
  popupTitle?: string;
};

type HealthItemIconProps = {
  state?: HealthState;
};
