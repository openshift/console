import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPoint, PrometheusResponse } from '@console/internal/components/graphs';
import {
  AreaChart,
  AreaChartStatus,
  chartStatusColors,
} from '@console/internal/components/graphs/area';
import { mapLimitsRequests } from '@console/internal/components/graphs/utils';
import { Humanize } from '@console/internal/components/utils/types';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  YellowExclamationTriangleIcon,
  RedExclamationCircleIcon,
  ColoredIconProps,
} from '../../status';

export enum LIMIT_STATE {
  ERROR = 'ERROR',
  WARN = 'WARN',
  OK = 'OK',
}

const getCurrentData = (
  humanizeValue: Humanize,
  description: string,
  data?: DataPoint[],
  dataUnits?: string,
): string => {
  let current: string;
  if (data && data.length > 0) {
    const latestData = data[data.length - 1];
    current = humanizeValue(latestData.y).string;
    if (dataUnits) {
      current += ` ${dataUnits}`;
    }
    current += ` ${description.toLowerCase()}`;
  }

  return current;
};

export const MultilineUtilizationItem: React.FC<MultilineUtilizationItemProps> = React.memo(
  ({
    title,
    data,
    dataUnits,
    humanizeValue,
    isLoading = false,
    queries,
    error,
    TopConsumerPopovers,
    byteDataType,
  }) => {
    const { t } = useTranslation();
    const current = data.map((datum, index) =>
      getCurrentData(humanizeValue, queries[index].desc, datum, dataUnits && dataUnits[index]),
    );
    const chart = (
      <AreaChart
        data={error ? [[]] : data}
        loading={!error && isLoading}
        query={queries.map((q) => q.query)}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={70}
        byteDataType={byteDataType}
        showAllTooltip
        ariaChartLinkLabel={t('console-shared~View {{title}} metrics in query browser', {
          title,
        })}
        ariaChartTitle={title}
      />
    );

    const currentValue = current.map((curr, index) => {
      const TopConsumerPopover = TopConsumerPopovers && TopConsumerPopovers[index];
      return TopConsumerPopover ? (
        <TopConsumerPopover key={queries[index].desc} current={curr} />
      ) : (
        <div key={queries[index].desc}>{curr}</div>
      );
    });

    return (
      <div className="co-utilization-card__item" data-test-id="utilization-item">
        <div className="co-utilization-card__item-description">
          <div className="co-utilization-card__item-section-multiline">
            <h4 className="pf-c-title pf-m-md">{title}</h4>
            {error || (!isLoading && !(data.length && data.every((datum) => datum.length))) ? (
              <div className="text-secondary">{t('console-shared~Not available')}</div>
            ) : (
              <div className="co-utilization-card__item-description">{currentValue}</div>
            )}
          </div>
        </div>
        <div className="co-utilization-card__item-chart">{chart}</div>
      </div>
    );
  },
);

// TODO (jon) Fix PrometheusMultilineUtilization so that x-values returned from multiple prometheus
// queries are "synced" on the x-axis (same number of points with the same x-values). In order to do
// so, we have to make sure that the same end time, samples, and duration are used across all
// queries. This is a temporary work around. See https://issues.redhat.com/browse/CONSOLE-2424
export const trimSecondsXMutator = (x) => {
  const d = new Date(x * 1000);
  d.setSeconds(0, 0);
  return d;
};

export const UtilizationItem: React.FC<UtilizationItemProps> = React.memo(
  ({
    title,
    utilization,
    humanizeValue,
    isLoading = false,
    query,
    error,
    max = null,
    TopConsumerPopover,
    byteDataType,
    limit,
    requested,
    setLimitReqState,
    setTimestamps,
  }) => {
    const { t } = useTranslation();
    const { data, chartStyle } = mapLimitsRequests(
      utilization,
      limit,
      requested,
      trimSecondsXMutator,
    );
    const [utilizationData, limitData, requestedData] = data;
    React.useEffect(() => {
      setTimestamps &&
        utilizationData &&
        setTimestamps(utilizationData.map((datum) => datum.x as Date));
    }, [setTimestamps, utilizationData]);
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
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={70}
        chartStyle={chartStyle}
        byteDataType={byteDataType}
        mainDataName="usage"
      />
    );

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
      <div className="co-utilization-card__item" data-test-id="utilization-item">
        <div className="co-utilization-card__item-description">
          <div className="co-utilization-card__item-section">
            <h4 className="pf-c-title pf-m-md">{title}</h4>
            {error || (!isLoading && !utilizationData?.length) ? (
              <div className="text-secondary">{t('console-shared~Not available')}</div>
            ) : (
              <div>
                {LimitIcon && <LimitIcon className="co-utilization-card__item-icon" />}
                {TopConsumerPopover ? (
                  <TopConsumerPopover
                    current={currentHumanized}
                    max={humanMax}
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
      </div>
    );
  },
);

export default UtilizationItem;

export type LimitRequested = {
  limit: LIMIT_STATE;
  requested: LIMIT_STATE;
};

type UtilizationItemProps = {
  title: string;
  utilization?: PrometheusResponse;
  limit?: PrometheusResponse;
  requested?: PrometheusResponse;
  isLoading: boolean;
  humanizeValue: Humanize;
  query: string | string[];
  error: boolean;
  max?: number;
  byteDataType?: ByteDataTypes;
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
  setLimitReqState?: (state: LimitRequested) => void;
  setTimestamps?: (timestamps: Date[]) => void;
};

type MultilineUtilizationItemProps = {
  title: string;
  data?: DataPoint[][];
  dataUnits?: string[];
  dataDescription?: string[];
  isLoading: boolean;
  humanizeValue: Humanize;
  queries: QueryWithDescription[];
  error: boolean;
  byteDataType?: ByteDataTypes;
  TopConsumerPopovers?: React.ComponentType<TopConsumerPopoverProp>[];
};

export type TopConsumerPopoverProp = {
  current: string;
  max?: string;
  limit?: string;
  available?: string;
  requested?: string;
  total?: string;
  limitState?: LIMIT_STATE;
  requestedState?: LIMIT_STATE;
};

export type QueryWithDescription = {
  query: string;
  desc: string;
};
