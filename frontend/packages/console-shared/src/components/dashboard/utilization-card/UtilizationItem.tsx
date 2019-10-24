import * as React from 'react';
import * as _ from 'lodash';
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
    multiLineMap,
    TopConsumerPopover,
    byteDataType,
  }) => {
    let current;
    let multiLineCurrent;
    let multiLine;
    if (data && data.length) {
      const latestData = data[data.length - 1];
      current = humanizeValue(latestData.y).string;
    }

    if (multiLineMap && multiLineMap.length) {
      const filterData = multiLineMap.filter(
        (dataObj) => dataObj.data && _.get(dataObj, 'data.length'),
      );
      multiLine = multiLineMap.map((dataObj) => dataObj.data && _.get(dataObj, 'data'));
      if (filterData.length) {
        const multiLineLatestData = filterData.map((dataObj) => {
          const latestData = dataObj.data[dataObj.data.length - 1];
          return [humanizeValue(latestData.y).string, dataObj.type];
        });
        [current, multiLineCurrent] = multiLineLatestData.map(
          (dataObj) => `${dataObj[0]} ${dataObj[1]}`,
        );
      }
    }

    let humanMax;
    let chartStatus;

    if (current && max) {
      humanMax = humanizeValue(max).string;
      const percentage = (100 * data[data.length - 1].y) / max;

      if (percentage >= 90) {
        chartStatus = AreaChartStatus.ERROR;
      } else if (percentage >= 75) {
        chartStatus = AreaChartStatus.WARNING;
      }
    }

    const chart = (
      <AreaChart
        data={error ? [] : data}
        loading={!error && isLoading}
        query={query}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={80}
        chartStatus={chartStatus}
        byteDataType={byteDataType}
        multiLine={multiLine}
      />
    );

    return (
      <div className="co-utilization-card__item">
        <div className="co-utilization-card__item__section">
          <div className="pf-l-level">
            <h4 className="pf-c-title pf-m-md">{title}</h4>
            {TopConsumerPopover && !error ? <TopConsumerPopover current={current} /> : current}
          </div>
          <div className="pf-l-level">
            <span className="co-utilization-card__item__text__size" />
            <span className="co-utilization-card__item__text__size">
              {TopConsumerPopover && !error ? (
                <TopConsumerPopover current={multiLineCurrent} />
              ) : (
                multiLineCurrent
              )}
            </span>
          </div>
          <div className="pf-l-level">
            <span className="co-utilization-card__item__text" />
            <span className="co-utilization-card__item__text">
              {humanMax && <span>of {humanMax}</span>}
            </span>
          </div>
        </div>
        <div className="co-utilization-card__item__chart">{chart}</div>
      </div>
    );
  },
);

export default UtilizationItem;

type UtilizationItemProps = {
  title: string;
  data?: DataPoint[];
  multiLineMap?: {
    data?: DataPoint[];
    type?: string;
  }[];
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
