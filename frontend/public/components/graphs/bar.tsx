import * as React from 'react';
import { ChartBarIcon } from '@patternfly/react-icons';
import {
  ChartBar,
  ChartLabel,
  ChartThemeColor,
  ChartThemeVariant,
  getCustomTheme,
} from '@patternfly/react-charts';

import { useRefWidth } from '../utils/ref-width-hook';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { barTheme } from './themes';
import { humanizeNumber, Humanize } from '../utils';
import { DataPoint } from '.';
import { getInstantVectorStats } from './utils';
import { GraphEmpty } from './graph-empty';

const DEFAULT_BAR_WIDTH = 10;
const PADDING_RATIO = 1 / 3;

export const BarChart: React.FC<BarChartProps> = ({
  barWidth = DEFAULT_BAR_WIDTH,
  title,
  query,
  data = [],
  theme = getCustomTheme(ChartThemeColor.blue, ChartThemeVariant.light, barTheme),
  titleClassName,
  loading = false,
  LabelComponent,
}) => {
  const [containerRef, width] = useRefWidth();

  // Max space that horizontal padding should take up. By default, 2/3 of the horizontal space is always available for the actual bar graph.
  const maxHorizontalPadding = PADDING_RATIO * width;

  const padding = {
    bottom: 15,
    left: 0,
    right: Math.min(100, maxHorizontalPadding),
    top: 0,
  };

  return (
    <PrometheusGraph ref={containerRef} title={title} className={titleClassName} >
      {
        data.length ? (
          <PrometheusGraphLink query={query}>
            {data.map((datum, index) => (
              <React.Fragment key={index}>
                <div className="graph-bar__label">
                  {LabelComponent ? <LabelComponent title={datum.x} metric={datum.metric} /> : datum.x}
                </div>
                <div className="graph-bar__chart">
                  <ChartBar
                    barWidth={barWidth}
                    data={[datum]}
                    horizontal
                    labelComponent={<ChartLabel x={width} />}
                    theme={theme}
                    height={barWidth + padding.bottom}
                    width={width}
                    domain={{y: [0, data[0].y]}}
                    padding={padding}
                  />
                </div>
              </React.Fragment>
            ))}
          </PrometheusGraphLink>
        ) : (
          <GraphEmpty icon={ChartBarIcon} loading={loading} height={100} />
        )
      }
    </PrometheusGraph>
  );
};

export const Bar: React.FC<BarProps> = ({
  humanize = humanizeNumber,
  metric,
  namespace,
  barWidth,
  theme,
  query,
  title,
}) => {
  const [response,, loading] = usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY, namespace, query });
  const data = getInstantVectorStats(response, metric, humanize);

  return (
    <BarChart
      title={title}
      query={query}
      data={data}
      barWidth={barWidth}
      theme={theme}
      loading={loading}
    />
  );
};

type LabelComponentProps = {
  title: Date | string | number;
  metric?: {[key: string]: string};
}

type BarChartProps = {
  LabelComponent?: React.ComponentType<LabelComponentProps>;
  barWidth?: number;
  query?: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  title?: string;
  data?: DataPoint[];
  titleClassName?: string;
  loading?: boolean;
}

type BarProps = {
  humanize?: Humanize;
  metric: string;
  namespace?: string;
  barWidth?: number;
  query: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  title?: string;
  titleClassName: string;
}
