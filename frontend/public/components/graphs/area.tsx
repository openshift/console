import * as _ from 'lodash';
import * as React from 'react';
/* eslint-disable-next-line camelcase */
import { chart_color_blue_300 as chartColorBlue300 } from '@patternfly/react-tokens';
import { VictoryScatter } from 'victory';
import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartThemeColor,
  ChartThemeVariant,
  ChartVoronoiContainer,
  getCustomTheme,
} from '@patternfly/react-charts';

import { twentyFourHourTime } from '../utils/datetime';
import { humanizeNumber, useRefWidth, Humanize } from '../utils';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { areaTheme } from './themes';
import { DataPoint, DomainPropType } from './';
import { getRangeVectorStats } from './utils';
import { GraphEmpty } from './graph-empty';

const DEFAULT_HEIGHT = 180;
const DEFAULT_SAMPLES = 60;
const DEFAULT_TICK_COUNT = 3;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export const AreaChart: React.FC<AreaChartProps> = ({
  className,
  data,
  formatDate = twentyFourHourTime,
  height = DEFAULT_HEIGHT,
  humanize = humanizeNumber,
  loading = true,
  padding,
  query,
  theme = getCustomTheme(ChartThemeColor.blue, ChartThemeVariant.light, areaTheme),
  tickCount = DEFAULT_TICK_COUNT,
  timespan,
  title,
  xAxis = true,
  yAxis = true,
}) => {
  const [containerRef, width] = useRefWidth();
  const [timestamp, setTimestamp] = React.useState(null);
  React.useEffect(() => {
    setTimestamp(Date.now());
  }, [data])

  const getLabel = ({x, y}) => `${humanize(y).string} at ${formatDate(x)}`;
  const container = <ChartVoronoiContainer labels={getLabel} voronoiDimension="x" />;
  const max = data.length ? _.maxBy(data, 'y') : {};

  // Force x-domain to show entire timespan
  // Force y-domain to be a reasonable range for a single data point or if all data values are 0
  const domain: DomainPropType = timestamp && {
    ...timespan && { x: [
      timestamp - timespan,
      timestamp,
    ]},
    ...(data.length === 1 || max.y === 0) && {
      y: [
        0,
        max.y * 2 || 1, // If max data point has a value of 0, y-domain max is 1
      ],
    },
  };
  return (
    <PrometheusGraph className={className} ref={containerRef} title={title}>
      {data.length ? (
        <PrometheusGraphLink query={query}>
          <Chart
            containerComponent={container}
            domainPadding={{y: 20}}
            height={height}
            width={width}
            theme={theme}
            scale={{x: 'time', y: 'linear'}}
            padding={padding}
          >
            {xAxis && <ChartAxis tickCount={tickCount} tickFormat={formatDate} />}
            {yAxis && <ChartAxis dependentAxis tickCount={tickCount} tickFormat={tick => humanize(tick).string} />}
            {
              // Show a scatter plot if only one data point
              data.length > 1
                ? <ChartArea data={data} domain={domain} />
                : <VictoryScatter data={data} domain={domain} style={{data:{fill: chartColorBlue300.value }}} />
            }
          </Chart>
        </PrometheusGraphLink>
      ) : (
        <GraphEmpty height={height} loading={loading} />
      )}
    </PrometheusGraph>
  );
};

export const Area: React.FC<AreaProps> = ({
  namespace,
  query,
  samples = DEFAULT_SAMPLES,
  timeout,
  timespan = DEFAULT_TIMESPAN,
  ...rest
}) => {
  const [response,, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    namespace,
    query,
    samples,
    timeout,
    timespan,
  });
  const data = getRangeVectorStats(response);

  return <AreaChart
    data={data}
    loading={loading}
    query={query}
    timespan={timespan}
    {...rest}
  />;
};

type AreaChartProps = {
  className?: string;
  data?: DataPoint[];
  formatDate?: (date: Date) => string;
  height?: number,
  humanize?: Humanize;
  loading?: boolean;
  padding?: object;
  query?: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  tickCount?: number;
  timespan?: number;
  title?: string;
  xAxis?: boolean;
  yAxis?: boolean;
}

type AreaProps = AreaChartProps & {
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
}
