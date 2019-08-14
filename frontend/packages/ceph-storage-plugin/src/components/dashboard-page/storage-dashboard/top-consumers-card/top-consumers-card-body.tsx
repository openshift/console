import * as React from 'react';
import * as _ from 'lodash';
import { ChartLineIcon } from '@patternfly/react-icons';
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
import { getGraphVectorStats, getMetricType } from './utils';

const chartPropsValue = {
  chartHeight: 175,
};

const chartLegendPropsValue = {
  x: 10,
  y: 5,
  symbolSpacer: 7,
  height: 30,
  gutter: 10,
};

const getYTickValues = (value: number): number[] => [
  Math.floor(value / 4),
  Math.floor(value / 2),
  Math.floor((3 * value) / 4),
  Math.floor(value),
  Math.floor((5 * value) / 4),
  Math.floor((6 * value) / 4),
];

export const TopConsumersBody: React.FC<TopConsumerBodyProps> = React.memo(
  ({ topConsumerStats, metricType, sortByOption }) => {
    if (!topConsumerStats) {
      return <LoadingInline />;
    }
    const topConsumerStatsResult = _.get(topConsumerStats, 'data.result', []);
    if (topConsumerStatsResult.length) {
      const legends = topConsumerStatsResult.map((resource) => ({
        name: getMetricType(resource, metricType),
      }));
      const resourceValues = _.flatMap(topConsumerStatsResult, (resource) => resource.values);
      const maxCapacity = _.maxBy(resourceValues, (value) => Number(value[1]));
      const maxCapacityConverted = humanizeBinaryBytesWithoutB(Number(maxCapacity[1]));
      const chartData = getGraphVectorStats(
        topConsumerStats,
        metricType,
        maxCapacityConverted.unit,
      );

      const chartLineList = chartData.map((data, i) => (
        <ChartLine key={i} data={data as DataPoint[]} /> // eslint-disable-line react/no-array-index-key
      ));
      return (
        <>
          <span className="text-secondary">{`${sortByOption}(${maxCapacityConverted.unit})`}</span>
          <Chart
            domain={{ y: [0, 1.5 * maxCapacityConverted.value] }}
            height={chartPropsValue.chartHeight}
            padding={{ top: 20, bottom: 20, left: 30, right: 20 }}
            containerComponent={
              <ChartVoronoiContainer
                labels={(datum) => `${datum.y} ${maxCapacityConverted.unit}`}
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
              tickValues={getYTickValues(maxCapacityConverted.value)}
              style={{ tickLabels: { fontSize: 8, padding: 5 }, grid: { stroke: '#4d525840' } }}
            />
            <ChartGroup>{chartLineList}</ChartGroup>
          </Chart>
          <ChartLegend
            data={legends}
            themeColor={ChartThemeColor.multi}
            x={chartLegendPropsValue.x}
            y={chartLegendPropsValue.y}
            symbolSpacer={chartLegendPropsValue.symbolSpacer}
            height={chartLegendPropsValue.height}
            gutter={chartLegendPropsValue.gutter}
            orientation="horizontal"
            style={{
              labels: { fontSize: 8 },
            }}
          />
        </>
      );
    }
    return <GraphEmpty icon={ChartLineIcon} />;
  },
);

type TopConsumerBodyProps = {
  topConsumerStats: PrometheusResponse[];
  metricType?: string;
  sortByOption?: string;
};
