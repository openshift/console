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
import { humanizeNumber, useRefWidth } from '../utils';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { areaTheme } from './themes';
import { HumanizeFunction } from './';
import { getRangeVectorStats } from './utils';

const DEFAULT_HEIGHT = 180;
const DEFAULT_SAMPLES = 60;
const DEFAULT_TICK_COUNT = 3;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export const Area: React.FC<AreaProps> = ({
  className,
  formatDate = twentyFourHourTime,
  height = DEFAULT_HEIGHT,
  humanize = humanizeNumber,
  namespace,
  query,
  samples = DEFAULT_SAMPLES,
  theme = getCustomTheme(ChartThemeColor.blue, ChartThemeVariant.light, areaTheme),
  tickCount = DEFAULT_TICK_COUNT,
  timeout,
  timespan = DEFAULT_TIMESPAN,
  title,
}) => {
  const [containerRef, width] = useRefWidth();
  const [response] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY_RANGE,
    namespace,
    query,
    samples,
    timeout,
    timespan,
  });
  const data = getRangeVectorStats(response);
  const getLabel = ({x, y}) => `${humanize(y).string} at ${formatDate(x)}`;
  const container = <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} />;
  return <PrometheusGraph ref={containerRef} className={className} title={title}>
    {
      data.length ? (
        <PrometheusGraphLink query={query}>
          <Chart
            containerComponent={container}
            domainPadding={{y: 20}}
            height={height}
            width={width}
            theme={theme}
            scale={{x: 'time', y: 'linear'}}
          >
            <ChartAxis tickCount={tickCount} tickFormat={formatDate} />
            <ChartAxis dependentAxis tickCount={tickCount} tickFormat={tick => humanize(tick).string} />
            <ChartArea data={data} />
          </Chart>
        </PrometheusGraphLink>
      ) : (
        <EmptyState className="graph-empty-state" variant={EmptyStateVariant.full}>
          <EmptyStateIcon size="sm" icon={ChartAreaIcon} />
          <Title size="sm">No Prometheus datapoints found.</Title>
        </EmptyState>
      )
    }
  </PrometheusGraph>;
};

type AreaProps = {
  className?: string;
  formatDate: (date: Date) => string;
  humanize: HumanizeFunction;
  height?: number,
  namespace?: string;
  query: string;
  samples?: number;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  tickCount?: number;
  timeout?: string;
  timespan?: number;
  title?: string;
}
