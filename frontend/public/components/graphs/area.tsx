import * as _ from 'lodash-es';
import * as React from 'react';
import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartGroup,
  ChartTheme,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';

import { twentyFourHourTime } from '../utils/datetime';
import { humanizeNumber, useRefWidth } from '../utils';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { areaTheme } from './themes';

const formatResponse = (response) => {
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
  height = 90,
  namespace,
  query,
  samples = 60,
  theme = ChartTheme.light.multi,
  tickCount = 3,
  timeout,
  timespan = 60 * 60 * 1000,
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
  const getLabel = ({y}) => formatY(y);
  const container = <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} />;

  return <PrometheusGraph className={className} query={query} title={title}>
    <div ref={containerRef} style={{width: '100%'}}>
      <Chart
        containerComponent={container}
        domainPadding={{y: 20}}
        height={height}
        width={width}
        // Override theme. Once PF React Charts is released and we update, there should be much less we need to override here.
        theme={_.merge(theme, areaTheme)}
        scale={{x: 'time', y: 'linear'}}
      >
        <ChartAxis tickCount={tickCount} tickFormat={formatX} />
        <ChartAxis dependentAxis tickCount={tickCount} tickFormat={formatY} />
        <ChartGroup>
          <ChartArea data={formatResponse(response)} />
        </ChartGroup>
      </Chart>
    </div>
  </PrometheusGraph>;
};

type AreaProps = {
  className?: string;
  formatX: (value: number | string) => string;
  formatY: (value: number | string) => string;
  height?: number,
  namespace?: string;
  query: string;
  samples?: number;
  theme?: any;
  tickCount?: number;
  timeout?: number;
  timespan?: number;
  title?: string;
}
