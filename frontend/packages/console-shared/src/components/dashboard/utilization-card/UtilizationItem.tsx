import * as React from 'react';
import { chart_color_orange_300 as limitColor } from '@patternfly/react-tokens';
import { Humanize } from '@console/internal/components/utils/types';
import {
  AreaChart,
  AreaChartStatus,
  chartStatusColors,
} from '@console/internal/components/graphs/area';
import { DataPoint } from '@console/internal/components/graphs';
import { ByteDataTypes } from 'packages/console-shared/src/graph-helper/data-utils';
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
    const current = data.map((datum, index) =>
      getCurrentData(humanizeValue, queries[index].desc, datum, dataUnits && dataUnits[index]),
    );
    const chart = (
      <AreaChart
        data={error ? [[]] : data}
        loading={!error && isLoading}
        query={queries[0].query}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={70}
        byteDataType={byteDataType}
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
            {error || (!isLoading && !data.every((datum) => datum.length)) ? (
              <div className="text-secondary">Not available</div>
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

export const UtilizationItem: React.FC<UtilizationItemProps> = React.memo(
  ({
    title,
    data,
    humanizeValue,
    isLoading = false,
    query,
    error,
    max = null,
    TopConsumerPopover,
    byteDataType,
    limit = null,
    requested = null,
    setLimitReqState,
  }) => {
    let current: string;
    if (data.length) {
      const latestData = data[data.length - 1];
      current = humanizeValue(latestData.y).string;
    }

    let humanMax: string;
    const chartStyle = [null, null, null];

    let humanAvailable: string;
    if (current && max) {
      humanMax = humanizeValue(max).string;
      const percentage = (100 * data[data.length - 1].y) / max;

      if (percentage >= 90) {
        chartStyle[0] = { data: { fill: chartStatusColors[AreaChartStatus.ERROR] } };
      } else if (percentage >= 80) {
        chartStyle[0] = { data: { fill: chartStatusColors[AreaChartStatus.WARNING] } };
      }

      humanAvailable = humanizeValue(max - data[data.length - 1].y).string;
    }

    const chartData = error ? [[]] : [data];
    if (!error && limit) {
      chartData.push(limit);
      chartStyle[1] = { data: { strokeDasharray: '3,3', fillOpacity: 0 } };
    }
    if (!error && requested) {
      chartData.push(requested);
      chartStyle[2] = {
        data: {
          stroke: limitColor.value,
          strokeDasharray: '3,3',
          fillOpacity: 0,
        },
      };
    }

    const chart = (
      <AreaChart
        data={chartData}
        loading={!error && isLoading}
        query={query}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={70}
        chartStyle={chartStyle}
        byteDataType={byteDataType}
      />
    );

    let LimitIcon: React.ComponentType<ColoredIconProps>;
    let humanLimit: string;
    let limitState = LIMIT_STATE.OK;
    let requestedState = LIMIT_STATE.OK;

    if (max) {
      if (limit && limit.length && requested && requested.length) {
        humanLimit = humanizeValue(limit[limit.length - 1].y).string;
        const limitPercentage = (100 * limit[limit.length - 1].y) / max;
        const reqPercentage = (100 * requested[requested.length - 1].y) / max;
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

    return (
      <div className="co-utilization-card__item" data-test-id="utilization-item">
        <div className="co-utilization-card__item-description">
          <div className="co-utilization-card__item-section">
            <h4 className="pf-c-title pf-m-md">{title}</h4>
            {error || (!isLoading && !data.length) ? (
              <div className="text-secondary">Not available</div>
            ) : (
              <div>
                {LimitIcon && <LimitIcon className="co-utilization-card__item-icon" />}
                {TopConsumerPopover ? (
                  <TopConsumerPopover
                    current={current}
                    max={humanMax}
                    limit={
                      limit && limit.length ? humanizeValue(limit[limit.length - 1].y).string : null
                    }
                    requested={
                      requested && requested.length
                        ? humanizeValue(requested[requested.length - 1].y).string
                        : null
                    }
                    available={humanAvailable}
                    total={humanMax}
                    limitState={limitState}
                    requestedState={requestedState}
                  />
                ) : (
                  current
                )}
              </div>
            )}
          </div>
          {!error && (humanAvailable || humanMax) && (
            <div className="co-utilization-card__item-section">
              <span className="co-utilization-card__item-text">
                {humanAvailable && <span>{humanAvailable} available</span>}
              </span>
              <span className="co-utilization-card__item-text">
                {humanLimit && <span>{humanLimit} total limit</span>}
                {!humanLimit && humanMax && <span>of {humanMax}</span>}
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
  data?: DataPoint[];
  limit?: DataPoint[];
  requested?: DataPoint[];
  isLoading: boolean;
  humanizeValue: Humanize;
  query: string;
  error: boolean;
  max?: number;
  byteDataType?: ByteDataTypes;
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
  setLimitReqState?: (state: LimitRequested) => void;
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
