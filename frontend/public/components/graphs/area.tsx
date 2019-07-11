import * as React from 'react';
import { ChartAreaIcon } from '@patternfly/react-icons';
import {
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
  Title,
} from '@patternfly/react-core';
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

const DEFAULT_HEIGHT = 180;
const DEFAULT_SAMPLES = 60;
const DEFAULT_TICK_COUNT = 3;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export const AreaChart: React.FC<AreaChartProps> = ({
  className,
  query,
  title,
  height = DEFAULT_HEIGHT,
  theme = getCustomTheme(ChartThemeColor.blue, ChartThemeVariant.light, areaTheme),
  tickCount = DEFAULT_TICK_COUNT,
  humanize = humanizeNumber,
  formatDate = twentyFourHourTime,
  data,
  xAxis = true,
  yAxis = true,
  padding,
}) => {
  const [containerRef, width] = useRefWidth();
  const getLabel = ({x, y}) => `${humanize(y).string} at ${formatDate(x)}`;
  const container = <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} />;
  return (
    <PrometheusGraph ref={containerRef} className={className} title={title}>
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
        <EmptyState className="graph-empty-state" variant={EmptyStateVariant.full}>
          <EmptyStateIcon size="sm" icon={ChartAreaIcon} />
          <Title size="sm">No Prometheus datapoints found.</Title>
        </EmptyState>
      )}
    </PrometheusGraph>)
  ;
};

export const Area: React.FC<AreaProps> = ({
  namespace,
  query,
  samples = DEFAULT_SAMPLES,
  timeout,
  timespan = DEFAULT_TIMESPAN,
  ...rest
}) => {
  const [response] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    namespace,
    query,
    samples,
    timeout,
    timespan,
  });
  const data = getRangeVectorStats(response);
  return (
    <AreaChart data={data} query={query} {...rest} />
  );
};

type AreaChartProps = {
  className?: string;
  formatDate?: (date: Date) => string;
  humanize?: Humanize;
  height?: number,
  query: string;
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
