import * as React from 'react';
import { Humanize } from '@console/internal/components/utils/types';
import { AreaChart, AreaChartStatus } from '@console/internal/components/graphs/area';
import { DataPoint } from '@console/internal/components/graphs';
import { ByteDataTypes } from 'packages/console-shared/src/graph-helper/data-utils';

const getCurrentData = (
  humanizeValue: Humanize,
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
  }

  return current;
};

const getHumanMax = (
  humanizeValue: Humanize,
  data: DataPoint[],
  current?: string,
  max?: number,
) => {
  let humanMax: string;
  let chartStatus: AreaChartStatus;
  if (current && max) {
    humanMax = humanizeValue(max).string;
    const percentage = (100 * data[data.length - 1].y) / max;

    if (percentage >= 90) {
      chartStatus = AreaChartStatus.ERROR;
    } else if (percentage >= 75) {
      chartStatus = AreaChartStatus.WARNING;
    }
  }

  return { humanMax, chartStatus };
};

export const UtilizationItem: React.FC<UtilizationItemProps> = React.memo(
  ({
    title,
    data,
    dataUnits,
    humanizeValue,
    isLoading = false,
    query,
    error,
    max = null,
    TopConsumerPopover,
    byteDataType,
  }) => {
    const multiData =
      !data || Array.isArray(data[0]) ? (data as DataPoint[][]) : [data as DataPoint[]]; // add dimension for single-line

    const current = multiData.map((singleLine, index) =>
      getCurrentData(humanizeValue, singleLine, dataUnits && dataUnits[index]),
    );
    const maxWithStatus = multiData.map((singleLine, index) =>
      getHumanMax(humanizeValue, singleLine, current[index], max),
    );
    const chartStatus = maxWithStatus.map((val) => val.chartStatus);

    const chart = (
      <AreaChart
        data={error ? [[]] : multiData}
        loading={!error && isLoading}
        query={query}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={80}
        chartStatus={chartStatus}
        byteDataType={byteDataType}
      />
    );

    let currentValue;
    if (TopConsumerPopover && !error) {
      currentValue = current.map((curr) => <TopConsumerPopover current={curr} />);
    } else {
      currentValue = current.map((curr) => <div>{curr}</div>);
    }

    return (
      <div className="co-utilization-card__item">
        <div className="co-utilization-card__item__section">
          <div className="pf-l-level">
            <h4 className="pf-c-title pf-m-md">{title}</h4>
            <div>{currentValue}</div>
          </div>
          <div className="pf-l-level">
            <span className="co-utilization-card__item__text" />
            <span className="co-utilization-card__item__text">
              {maxWithStatus.map((val) => val.humanMax && <span>of {val.humanMax}</span>)}
            </span>
          </div>
        </div>
        <div className="co-utilization-card__item__chart">{chart}</div>
      </div>
    );
  },
);
UtilizationItem.displayName = 'UtilizationItem';

export default UtilizationItem;

type UtilizationItemProps = {
  title: string;
  data?: DataPoint[] | DataPoint[][];
  dataUnits?: string[];
  isLoading: boolean;
  humanizeValue: Humanize;
  query: string;
  error: boolean;
  max?: number;
  byteDataType?: ByteDataTypes;
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
};

type TopConsumerPopoverProp = {
  current: string;
};
