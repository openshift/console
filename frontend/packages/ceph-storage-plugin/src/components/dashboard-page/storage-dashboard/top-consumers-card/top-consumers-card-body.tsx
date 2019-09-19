/* eslint-disable dot-notation */

import * as React from 'react';
import * as _ from 'lodash';
import {
  Chart,
  ChartAxis,
  ChartGroup,
  ChartLegend,
  ChartLine,
  ChartThemeColor,
  ChartTooltip,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';
import { DataPoint, PrometheusResponse } from '@console/internal/components/graphs';
import { humanizeBinaryBytesWithoutB, LoadingInline } from '@console/internal/components/utils';
import { twentyFourHourTime } from '@console/internal/components/utils/datetime';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { getGraphVectorStats, sortResources } from './utils';

const chartPropsValue = {
  chartHeight: 175,
};

const chartLegendPropsValue = {
  x: 80,
  y: 15,
  symbolSpacer: 6,
  height: 80,
  gutter: 0,
};

const getMaxCapacity = (topConsumerStatsResult: PrometheusResponse['data']['result']) => {
  const resourceValues = _.flatMap(topConsumerStatsResult, (resource) => resource.values);
  const maxCapacity = _.maxBy(resourceValues, (value) => Number(value[1]));
  return humanizeBinaryBytesWithoutB(Number(maxCapacity[1]));
};

export const TopConsumersBody: React.FC<TopConsumerBodyProps> = React.memo(
  ({ topConsumerStats, metricType, sortByOption, error }) => {
    if (error) {
      return <GraphEmpty />;
    }
    if (!topConsumerStats) {
      return <LoadingInline />;
    }
    const topConsumerStatsResult = _.get(topConsumerStats, 'data.result', []);
    if (topConsumerStatsResult.length) {
      const maxCapacityConverted = getMaxCapacity(topConsumerStatsResult);
      const sortedResult = topConsumerStatsResult.sort(sortResources);

      const chartData = getGraphVectorStats(sortedResult, metricType, maxCapacityConverted.unit);

      // Sorts the line data whose capacity are equal according to the name
      const sortByNameFunction = (obj: DataPoint[][]) => {
        obj.sort(function(a, b) {
          if (a[0].y !== b[0].y) {
            return 0;
          }
          const nameA = a[0]['name'].toLowerCase();
          const nameB = b[0]['name'].toLowerCase();

          return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
        });
        return obj;
      };

      const chartLineListSorted = sortByNameFunction(chartData).map((data, i) => (
        <ChartLine key={i} data={data as DataPoint[]} /> // eslint-disable-line react/no-array-index-key
      ));

      // Legends from sorted data
      const legends = chartLineListSorted.map((lineChart) => ({
        name: lineChart.props.data[0].name,
      }));

      return (
        <>
          <span className="text-secondary">{`${sortByOption}(${maxCapacityConverted.unit})`}</span>
          <Chart
            domain={{ y: [0, 1.5 * maxCapacityConverted.value] }}
            height={chartPropsValue.chartHeight}
            padding={{ top: 20, bottom: 30, left: 40, right: 30 }}
            containerComponent={
              <ChartVoronoiContainer
                labels={(datum) =>
                  `${datum.y} ${maxCapacityConverted.unit} at ${twentyFourHourTime(datum.x)}`
                }
                labelComponent={<ChartTooltip style={{ fontSize: 8, padding: 5 }} />}
              />
            }
            themeColor={ChartThemeColor.multi}
            scale={{ x: 'time' }}
          >
            <ChartAxis
              tickFormat={(x) => twentyFourHourTime(x)}
              style={{ tickLabels: { fontSize: 8, padding: 5 } }}
            />
            <ChartAxis
              dependentAxis
              tickCount={5}
              style={{ tickLabels: { fontSize: 8, padding: 5 }, grid: { stroke: '#4d525840' } }}
            />
            <ChartGroup>{chartLineListSorted}</ChartGroup>
          </Chart>
          <ChartLegend
            data={legends}
            themeColor={ChartThemeColor.multi}
            x={chartLegendPropsValue.x}
            y={chartLegendPropsValue.y}
            symbolSpacer={chartLegendPropsValue.symbolSpacer}
            height={chartLegendPropsValue.height}
            orientation="horizontal"
            width={800}
            rowGutter={{ top: 0, bottom: 1 }}
            itemsPerRow={2}
            style={{
              labels: { fontSize: 15 },
            }}
          />
        </>
      );
    }
    return <GraphEmpty />;
  },
);

type TopConsumerBodyProps = {
  topConsumerStats: PrometheusResponse;
  metricType?: string;
  sortByOption?: string;
  error: any;
};
