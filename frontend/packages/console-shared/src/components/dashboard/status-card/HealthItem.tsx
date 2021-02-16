import * as React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';
import { HealthState, healthStateMapping, healthStateMessage } from './states';
import { SecondaryStatus } from '../../status';

const HealthItemIcon: React.FC<HealthItemIconProps> = ({ state }) => (
  <div className="co-dashboard-icon">
    {(healthStateMapping[state] || healthStateMapping[HealthState.UNKNOWN]).icon}
  </div>
);

const HealthItem: React.FC<HealthItemProps> = React.memo(
  ({ className, state, title, details, popupTitle, noIcon = false, children }) => {
    const { t } = useTranslation();

    const detailMessage = details || healthStateMessage(state, t);

    return (
      <div className={classNames('co-status-card__health-item', className)}>
        {state === HealthState.LOADING ? (
          <div className="skeleton-health">
            <span className="pf-u-screen-reader">
              {t('public~Loading {{title}} status', { title })}
            </span>
          </div>
        ) : (
          !noIcon && <HealthItemIcon state={state} />
        )}
        <div>
          <span className="co-dashboard-text--small co-status-card__health-item-text">
            {React.Children.toArray(children).length && state !== HealthState.LOADING ? (
              <DashboardCardPopupLink
                linkTitle={title}
                popupTitle={popupTitle}
                className="co-status-card__popup"
              >
                {children}
              </DashboardCardPopupLink>
            ) : (
              title
            )}
          </span>
          {state !== HealthState.LOADING && detailMessage && (
            <SecondaryStatus status={detailMessage} className="co-status-card__health-item-text" />
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
  popupTitle?: string;
  noIcon?: boolean;
};

type HealthItemIconProps = {
  state?: HealthState;
};
