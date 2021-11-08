import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { HealthItemProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { SecondaryStatus } from '../../status';
import { HealthState, healthStateMapping, healthStateMessage } from './states';

const HealthItemIcon: React.FC<HealthItemIconProps> = ({ state, dataTest }) => (
  <div data-test={dataTest} className="co-dashboard-icon">
    {(healthStateMapping[state] || healthStateMapping[HealthState.UNKNOWN]).icon}
  </div>
);

const HealthItem: React.FC<HealthItemProps> = React.memo(
  ({ className, state, title, details, popupTitle, noIcon = false, icon, children }) => {
    const { t } = useTranslation();

    const detailMessage = details || healthStateMessage(state, t);

    return (
      <div
        className={classNames('co-status-card__health-item', className)}
        data-item-id={`${title}-health-item`}
      >
        {state === HealthState.LOADING ? (
          <div className="skeleton-health">
            <span className="pf-u-screen-reader">
              {t('public~Loading {{title}} status', { title })}
            </span>
          </div>
        ) : (
          !noIcon &&
          (icon || <HealthItemIcon state={state} dataTest={`${title}-health-item-icon`} />)
        )}
        <div>
          <span className="co-status-card__health-item-text">
            {React.Children.toArray(children).length && state !== HealthState.LOADING ? (
              <Popover
                position={PopoverPosition.top}
                headerContent={popupTitle}
                bodyContent={children}
                enableFlip
                maxWidth="21rem"
              >
                <Button variant="link" isInline className="co-status-card__popup">
                  {title}
                </Button>
              </Popover>
            ) : (
              title
            )}
          </span>
          {state !== HealthState.LOADING && detailMessage && (
            <SecondaryStatus
              status={detailMessage}
              className="co-status-card__health-item-text"
              dataStatusID={`${title}-secondary-status`}
            />
          )}
        </div>
      </div>
    );
  },
);

export default HealthItem;

type HealthItemIconProps = {
  state?: HealthState;
  dataTest?: string;
};
