import * as _ from 'lodash-es';
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
  ChartGroup,
  ChartThemeColor,
  ChartThemeVariant,
  ChartVoronoiContainer,
  getCustomTheme,
} from '@patternfly/react-charts';

import { twentyFourHourTime } from '../utils/datetime';
import { humanizeNumber, useRefWidth } from '../utils';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { areaTheme } from './themes';
import { DataPoint, MutatorFunction, PrometheusResponse } from './';

const DEFAULT_HEIGHT = 100;
const DEFAULT_SAMPLES = 60;
const DEFAULT_TICK_COUNT = 3;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

const formatResponse = (response: PrometheusResponse): DataPoint[] => {
  const values = _.get(response, 'data.result[0].values');
  return _.map(values, value => ({
    x: new Date(value[0] * 1000),
    y: parseFloat(value[1]),
  }));
};

export const Area: React.FC<AreaProps> = ({
  className,
  formatX = twentyFourHourTime,
  formatY = humanizeNumber,
  height = DEFAULT_HEIGHT,
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
  const data = formatResponse(response);
  const getLabel = ({y}) => formatY(y);
  const container = <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} />;
  return <PrometheusGraph ref={containerRef} className={className} query={query} title={title}>
    {
      data.length
        ? <Chart
          containerComponent={container}
          domainPadding={{y: 20}}
          height={height}
          width={width}
          theme={theme}
          scale={{x: 'time', y: 'linear'}}
        >
          <ChartAxis tickCount={tickCount} tickFormat={formatX} />
          <ChartAxis dependentAxis tickCount={tickCount} tickFormat={formatY} />
          <ChartGroup>
            <ChartArea data={data} />
          </ChartGroup>
        </Chart>
        : <EmptyState className="graph-empty-state" variant={EmptyStateVariant.full}>
          <EmptyStateIcon size="sm" icon={ChartAreaIcon} />
          <Title size="sm">No Prometheus datapoints found.</Title>
        </EmptyState>
    }
  </PrometheusGraph>;
};


type AreaProps = {
  className?: string;
  formatX: MutatorFunction;
  formatY: MutatorFunction;
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
