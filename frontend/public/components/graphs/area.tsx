import * as _ from 'lodash-es';
import * as React from 'react';
import { Chart, ChartArea, ChartVoronoiContainer, ChartAxis, ChartTheme, ChartGroup } from '@patternfly/react-charts';

import { humanizeNumber } from '../utils';
import { twentyFourHourTime } from '../utils/datetime';
import { areaStyles, cartesianChartStyles } from './themes';
import { useRefWidth } from '../utils/use-ref-width';
import { usePrometheusPoll, PrometheusQuery } from './use-prometheus-poll';
import { PrometheusGraph } from './prometheus-graph';

export const Area: React.FC<AreaProps> = ({
  basePath,
  className,
  height = 90,
  humanizeTime = twentyFourHourTime,
  humanizeValue = humanizeNumber,
  namespace,
  numSamples,
  query,
  theme = ChartTheme.light.multi,
  tickCount = 3,
  timeout,
  timeSpan,
  title,
}) => {
  const [containerRef, width] = useRefWidth();
  const [data] = usePrometheusPoll({basePath, namespace, numSamples, query, timeout, timeSpan, defaultQueryName: title});
  // Override theme. Once PF React Charts is released and we update, there should be much less we need to override here.
  const _theme = _.merge(theme, cartesianChartStyles, areaStyles);
  const getLabel = ({name, y}) => (data.length > 1) ? `${name}: ${humanizeValue(y)}` : humanizeValue(y);
  const container = <ChartVoronoiContainer voronoiDimension="x" labels={getLabel} />;
  return <PrometheusGraph className={className} query={query} title={title}>
    <div ref={containerRef} style={{width: '100%'}}>
      <Chart
        containerComponent={container}
        domainPadding={{y: 20}}
        height={height}
        width={width}
        theme={_theme}
        scale={{x: 'time', y: 'linear'}}
      >
        <ChartAxis tickCount={tickCount} tickFormat={humanizeTime} />
        <ChartAxis dependentAxis tickCount={tickCount} tickFormat={humanizeValue} />
        <ChartGroup>
          { _.map(data, (values, i) => <ChartArea key={i} data={values} />) }
        </ChartGroup>
      </Chart>
    </div>
  </PrometheusGraph>;
};

type AreaProps = {
  basePath: string;
  className: string;
  height: number,
  humanizeTime: (date: Date) => string;
  humanizeValue: (value: string | number) => string;
  namespace: string;
  numSamples: number;
  query: PrometheusQuery[] | string;
  theme: any;
  tickCount: number;
  timeout: number;
  timeSpan: number;
  title: string;
}
