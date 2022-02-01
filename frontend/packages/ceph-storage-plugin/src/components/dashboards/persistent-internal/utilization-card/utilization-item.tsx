import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { PrometheusResponse } from '@console/internal/module/k8s';
import { mapLimitsRequests } from '@console/internal/components/graphs/utils';
import { Humanize } from '@console/internal/components/utils';
import { ColoredIconProps } from '@console/dynamic-plugin-sdk/src/app/components/status/icons';
import {
  YellowExclamationTriangleIcon,
  RedExclamationCircleIcon,
} from '@console/shared/src/components/status';
import { TopConsumerPopoverProps } from '@console/dynamic-plugin-sdk';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { AreaChart } from './area-chart';

enum LIMIT_STATE {
  ERROR = 'ERROR',
  WARN = 'WARN',
  OK = 'OK',
}

enum AreaChartStatus {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

const chartStatusColors = {
  [AreaChartStatus.ERROR]: dangerColor.value,
  [AreaChartStatus.WARNING]: warningColor.value,
};

export const UtilizationItem: React.FC<UtilizationItemProps> = React.memo(
  ({
    TopConsumerPopover,
    byteDataType,
    error,
    humanizeValue,
    isLoading = false,
    limit,
    max = null,
    query,
    requested,
    setLimitReqState,
    title,
    utilization,
  }) => {
    const { t } = useTranslation();
    const trimSecondsXMutator = (x: number) => {
      const d = new Date(x * 1000);
      d.setSeconds(0, 0);
      return d;
    };
    const { data, chartStyle } = mapLimitsRequests(
      utilization,
      limit,
      requested,
      trimSecondsXMutator,
    );
    const [utilizationData, limitData, requestedData] = data;
    const current = utilizationData?.length ? utilizationData[utilizationData.length - 1].y : null;

    let humanMax: string;
    let humanAvailable: string;
    if (current && max) {
      humanMax = humanizeValue(max).string;
      const percentage = (100 * current) / max;

      if (percentage >= 90) {
        chartStyle[0] = { data: { fill: chartStatusColors[AreaChartStatus.ERROR] } };
      } else if (percentage >= 80) {
        chartStyle[0] = { data: { fill: chartStatusColors[AreaChartStatus.WARNING] } };
      }

      humanAvailable = humanizeValue(max - current).string;
    }

    const chart = (
      <AreaChart
        ariaChartLinkLabel={t('console-shared~View {{title}} metrics in query browser', {
          title,
        })}
        ariaChartTitle={title}
        data={data}
        loading={!error && isLoading}
        query={query}
        // Todo(bipuladh): Make humanize type Humanize once unit.js is converted
        humanize={humanizeValue as Humanize}
        byteDataType={byteDataType}
        chartStyle={chartStyle}
        mainDataName="usage"
      />
    );

    // Code below is used to render Consumer Popovers.
    let LimitIcon: React.ComponentType<ColoredIconProps>;
    let humanLimit: string;
    let limitState = LIMIT_STATE.OK;
    let requestedState = LIMIT_STATE.OK;

    const latestLimit = limitData?.length ? limitData[limitData.length - 1].y : null;
    const latestRequested = requestedData?.length
      ? requestedData[requestedData.length - 1].y
      : null;

    if (max) {
      if (latestLimit && latestRequested) {
        humanLimit = humanizeValue(latestLimit).string;
        const limitPercentage = (100 * latestLimit) / max;
        const reqPercentage = (100 * latestRequested) / max;
        if (limitPercentage > 100) {
          limitState = LIMIT_STATE.ERROR;
        } else if (limitPercentage >= 75) {
          limitState = LIMIT_STATE.WARN;
        }
        if (reqPercentage > 100) {
          requestedState = LIMIT_STATE.ERROR;
        } else if (reqPercentage >= 75) {
          requestedState = LIMIT_STATE.WARN;
        }
        if ([limitState, requestedState].includes(LIMIT_STATE.ERROR)) {
          LimitIcon = RedExclamationCircleIcon;
        } else if ([limitState, requestedState].includes(LIMIT_STATE.WARN)) {
          LimitIcon = YellowExclamationTriangleIcon;
        }
        setLimitReqState && setLimitReqState({ limit: limitState, requested: requestedState });
      }
    }

    const currentHumanized = current ? humanizeValue(current).string : null;

    return (
      <div className="co-utilization-card__item-ceph" data-test-id="utilization-item">
        <div className="co-utilization-card__item-description-ceph">
          <div className="co-utilization-card__item-section">
            <h4 className="pf-c-title pf-m-lg" style={{ marginRight: '20px' }}>
              {title}
            </h4>
            {error || (!isLoading && !utilizationData?.length) ? (
              <div className="text-secondary">{t('console-shared~Not available')}</div>
            ) : (
              <div className="co-utilization-card__item-section-ceph">
                {LimitIcon && <LimitIcon className="co-utilization-card__item-icon" />}
                {TopConsumerPopover ? (
                  <TopConsumerPopover
                    current={currentHumanized}
                    limit={latestLimit ? humanizeValue(latestLimit).string : null}
                    requested={latestRequested ? humanizeValue(latestRequested).string : null}
                    available={humanAvailable}
                    total={humanMax}
                    limitState={limitState}
                    requestedState={requestedState}
                  />
                ) : (
                  currentHumanized
                )}
              </div>
            )}
          </div>
          {!error && (humanAvailable || humanMax) && (
            <div className="co-utilization-card__item-section">
              <span
                className="co-utilization-card__item-text"
                data-test="utilization-card-item-text"
              >
                {humanLimit && (
                  <span>
                    {t(
                      'console-shared~{{humanAvailable}} available of {{humanLimit}} total limit',
                      {
                        humanAvailable,
                        humanLimit,
                      },
                    )}
                  </span>
                )}
                {!humanLimit && humanMax && (
                  <span>
                    {t('console-shared~{{humanAvailable}} available of {{humanMax}}', {
                      humanAvailable,
                      humanMax,
                    })}
                  </span>
                )}
                {!humanLimit && !humanMax && (
                  <span>
                    {t('console-shared~{{humanAvailable}} available', {
                      humanAvailable,
                    })}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="co-utilization-card__item-chart">{chart}</div>
        <hr style={{ border: '1px lightgray solid', margin: '0px' }} />
      </div>
    );
  },
);

type UtilizationItemProps = {
  title: string;
  utilization?: PrometheusResponse;
  limit?: PrometheusResponse;
  requested?: PrometheusResponse;
  isLoading: boolean;
  // Todo(bipuladh): Make humanize type Humanize once unit.js is converted
  humanizeValue: Function;
  query: string | string[];
  error: boolean;
  max?: number;
  byteDataType?: ByteDataTypes;
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProps>;
  setLimitReqState?: (state: { limit: LIMIT_STATE; requested: LIMIT_STATE }) => void;
};
