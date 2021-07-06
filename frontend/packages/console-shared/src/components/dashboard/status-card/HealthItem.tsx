import * as React from 'react';
import { Split, SplitItem } from '@patternfly/react-core';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { SecondaryStatus } from '../../status';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';
import { HealthState, healthStateMapping, healthStateMessage } from './states';

const renderAlerts = (alerts: string[], icon: React.ReactNode): React.ReactNode =>
  alerts.map((alert) => (
    <Split hasGutter key={alert}>
      <SplitItem>{icon}</SplitItem>
      <SplitItem isFilled>
        <strong>{alert}</strong>
      </SplitItem>
      <SplitItem>
        <a href="https://www.example.com">Troubleshoot</a>
      </SplitItem>
    </Split>
  ));

const HealthItemIcon: React.FC<HealthItemIconProps> = ({ state, dataTest }) => (
  <div data-test={dataTest} className="co-dashboard-icon">
    {(healthStateMapping[state] || healthStateMapping[HealthState.UNKNOWN]).icon}
  </div>
);

const HealthItem: React.FC<HealthItemProps> = React.memo(
  ({ alerts, className, state, title, details, popupTitle, noIcon = false, icon, children }) => {
    const { t } = useTranslation();

    const detailMessage = details || healthStateMessage(state, t);

    const renderHealthItemIcon = (
      <HealthItemIcon state={state} dataTest={`${title}-health-item-icon`} />
    );

    return (
      <div
        className={classNames('co-status-card__health-item', className)}
        data-test={`${title}-health-item`}
      >
        {state === HealthState.LOADING ? (
          <div className="skeleton-health">
            <span className="pf-u-screen-reader">
              {t('public~Loading {{title}} status', { title })}
            </span>
          </div>
        ) : (
          !noIcon && (icon || renderHealthItemIcon)
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
            ) : alerts && alerts.length ? (
              <DashboardCardPopupLink linkTitle={title} popupTitle="Active health checks">
                {renderAlerts(alerts, renderHealthItemIcon)}
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
  alerts?: string[];
  title: string;
  className?: string;
  details?: string;
  state?: HealthState;
  popupTitle?: string;
  noIcon?: boolean;
  icon?: React.ReactNode;
};

type HealthItemIconProps = {
  state?: HealthState;
  dataTest?: string;
};
