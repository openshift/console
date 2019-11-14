import * as React from 'react';
import { Humanize } from '@console/internal/components/utils/types';
import { AreaChart, AreaChartStatus } from '@console/internal/components/graphs/area';
import { DataPoint } from '@console/internal/components/graphs';
import { ByteDataTypes } from 'packages/console-shared/src/graph-helper/data-utils';

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
  }) => {
    let current;
    if (data.length) {
      const latestData = data[data.length - 1];
      current = humanizeValue(latestData.y).string;
    }

    let humanMax;
    let chartStatus;

    let humanAvailable;
    if (current && max) {
      humanMax = humanizeValue(max).string;
      const percentage = (100 * data[data.length - 1].y) / max;

      if (percentage >= 90) {
        chartStatus = AreaChartStatus.ERROR;
      } else if (percentage >= 75) {
        chartStatus = AreaChartStatus.WARNING;
      }

      humanAvailable = humanizeValue(max - data[data.length - 1].y).string;
    }

    const chart = (
      <AreaChart
        data={error ? [] : data}
        loading={!error && isLoading}
        query={query}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={70}
        chartStatus={chartStatus}
        byteDataType={byteDataType}
      />
    );

    return (
      <div className="co-utilization-card__item">
        <div className="co-utilization-card__item-description">
          <div className="co-utilization-card__item-section">
            <h4 className="pf-c-title pf-m-md">{title}</h4>
            {error || (!isLoading && !data.length) ? (
              <div className="text-secondary">Not available</div>
            ) : TopConsumerPopover ? (
              <TopConsumerPopover current={current} />
            ) : (
              current
            )}
          </div>
          {!error && (humanAvailable || humanMax) && (
            <div className="co-utilization-card__item-section">
              <span className="co-utilization-card__item-text">
                {humanAvailable && <span>{humanAvailable} available</span>}
              </span>
              <span className="co-utilization-card__item-text">
                {humanMax && <span>of {humanMax}</span>}
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

type UtilizationItemProps = {
  title: string;
  data?: DataPoint[];
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
