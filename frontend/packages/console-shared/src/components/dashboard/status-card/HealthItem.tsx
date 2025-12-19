import type { FC } from 'react';
import { cloneElement, memo, Children } from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { HealthItemProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { SecondaryStatus } from '../../status';
import { HealthState, healthStateMapping, healthStateMessage } from './states';

const HealthItemIcon: FC<HealthItemIconProps> = ({ state, dataTest }) => {
  const Icon = (healthStateMapping[state] || healthStateMapping[HealthState.UNKNOWN]).icon;
  return (
    <div data-test={dataTest} className="co-dashboard-icon">
      {cloneElement(Icon, { size: 'heading_2xl' })}
    </div>
  );
};

const HealthItem: FC<HealthItemProps> = memo(
  ({
    className,
    state,
    title,
    details,
    popupTitle,
    popupClassname,
    popupBodyContent,
    popupKeepOnOutsideClick = false,
    noIcon = false,
    icon,
    children,
  }) => {
    const { t } = useTranslation();

    const detailMessage = details || healthStateMessage(state, t);

    return (
      <div
        className={css('co-status-card__health-item', className)}
        data-item-id={`${title}-health-item`}
      >
        {state === HealthState.LOADING ? (
          <div className="skeleton-health">
            <span className="pf-v6-u-screen-reader">
              {t('public~Loading {{title}} status', { title })}
            </span>
          </div>
        ) : (
          !noIcon &&
          (icon || <HealthItemIcon state={state} dataTest={`${title}-health-item-icon`} />)
        )}
        <div>
          <span className="co-status-card__health-item-text">
            {(Children.toArray(children).length || popupBodyContent) &&
            state !== HealthState.LOADING ? (
              <Popover
                className={popupClassname}
                position={PopoverPosition.top}
                headerContent={popupTitle}
                bodyContent={popupBodyContent || children}
                enableFlip
                maxWidth="21rem"
                hideOnOutsideClick={!popupKeepOnOutsideClick}
              >
                <Button
                  variant="link"
                  isInline
                  className="co-status-card__popup"
                  data-test={`${title}`}
                >
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
