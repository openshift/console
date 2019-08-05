import * as React from 'react';
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
import { DataPoint } from './';
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
  title,
  xAxis = true,
  yAxis = true,
}) => {
  const [containerRef, width] = useRefWidth();
  const getLabel = ({x, y}) => `${humanize(y).string} at ${formatDate(x)}`;
  const container = <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} />;
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
            <ChartArea data={data} />
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
  return <AreaChart data={data} loading={loading} query={query} {...rest} />;
};

type AreaChartProps = {
  className?: string;
  formatDate?: (date: Date) => string;
  humanize?: Humanize;
  height?: number,
  loading?: boolean;
  query?: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  tickCount?: number;
  title?: string;
  data?: DataPoint[];
  xAxis?: boolean;
  yAxis?: boolean;
  padding?: object;
}

type AreaProps = AreaChartProps & {
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
}
