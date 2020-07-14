import * as React from 'react';
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
  barSpacing = 15,
  barWidth = DEFAULT_BAR_WIDTH,
  data = [],
  LabelComponent,
  loading = false,
  noLink = false,
  query,
  theme = getCustomTheme(ChartThemeColor.blue, ChartThemeVariant.light, barTheme),
  title,
  titleClassName,
}) => {
  const [containerRef, width] = useRefWidth();

  // Max space that horizontal padding should take up. By default, 2/3 of the horizontal space is always available for the actual bar graph.
  const maxHorizontalPadding = PADDING_RATIO * width;

  const padding = {
    bottom: barSpacing,
    left: 0,
    right: Math.min(100, maxHorizontalPadding),
    top: 0,
  };

  return (
    <PrometheusGraph ref={containerRef} title={title} className={titleClassName}>
      {data.length ? (
        <PrometheusGraphLink query={noLink ? undefined : query}>
          {data.map((datum, index) => (
            <React.Fragment key={index}>
              <div className="graph-bar__label">
                {LabelComponent ? (
                  <LabelComponent title={datum.x} metric={datum.metric} />
                ) : (
                  datum.x
                )}
              </div>
              <div className="graph-bar__chart">
                <ChartBar
                  barWidth={barWidth}
                  data={[datum]}
                  horizontal
                  labelComponent={
                    <ChartLabel x={width} textAnchor={theme.bar?.style?.labels?.textAnchor} />
                  }
                  theme={theme}
                  height={barWidth + padding.bottom}
                  width={width}
                  domain={{ y: [0, data[0].y] }}
                  padding={padding}
                />
              </div>
            </React.Fragment>
          ))}
        </PrometheusGraphLink>
      ) : (
        <GraphEmpty loading={loading} />
      )}
    </PrometheusGraph>
  );
};

export const Bar: React.FC<BarProps> = ({
  barSpacing,
  barWidth,
  delay = undefined,
  humanize = humanizeNumber,
  LabelComponent,
  metric,
  namespace,
  noLink = false,
  query,
  theme,
  title,
}) => {
  const [response, , loading] = usePrometheusPoll({
    delay,
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query,
  });
  const data = getInstantVectorStats(response, metric, humanize);

  return (
    <BarChart
      barSpacing={barSpacing}
      barWidth={barWidth}
      data={data}
      LabelComponent={LabelComponent}
      loading={loading}
      noLink={noLink}
      query={query}
      theme={theme}
      title={title}
    />
  );
};

type LabelComponentProps = {
  title: Date | string | number;
  metric?: { [key: string]: string };
};

type BarChartProps = {
  barSpacing?: number;
  barWidth?: number;
  data?: DataPoint[];
  LabelComponent?: React.ComponentType<LabelComponentProps>;
  loading?: boolean;
  noLink?: boolean;
  query?: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  title?: string;
  titleClassName?: string;
};

type BarProps = {
  barSpacing?: number;
  barWidth?: number;
  delay?: number;
  humanize?: Humanize;
  LabelComponent?: React.ComponentType<LabelComponentProps>;
  metric: string;
  namespace?: string;
  noLink?: boolean;
  query: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  title?: string;
  titleClassName: string;
};
