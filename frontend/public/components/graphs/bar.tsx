import type { FC, ComponentType } from 'react';
import { Fragment } from 'react';
import {
  ChartBar,
  ChartLabel,
  ChartThemeColor,
  getCustomTheme,
} from '@patternfly/react-charts/victory';

import { useRefWidth } from '../utils/ref-width-hook';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { barTheme } from './themes';
import { humanizeNumber } from '../utils/units';
import type { Humanize } from '../utils/types';
import { DataPoint } from '.';
import { getInstantVectorStats } from './utils';
import { GraphEmpty } from './graph-empty';

import { CustomDataSource } from '@console/dynamic-plugin-sdk/src/extensions/dashboard-data-source';

const DEFAULT_BAR_WIDTH = 10;
const PADDING_RATIO = 1 / 3;

export const BarChart: FC<BarChartProps> = ({
  barSpacing = 15,
  barWidth = DEFAULT_BAR_WIDTH,
  data = [],
  LabelComponent,
  loading = false,
  noLink = false,
  query,
  theme = getCustomTheme(ChartThemeColor.blue, barTheme),
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
      <PrometheusGraphLink query={noLink ? undefined : query}>
        {data.length ? (
          <div data-test="bar-chart" role="img" aria-label={title}>
            {data.map((datum, index) => (
              <Fragment key={index}>
                <div className="graph-bar__label" data-test={`bar-label-${index}`}>
                  {LabelComponent ? (
                    <LabelComponent title={datum.x} metric={datum.metric} />
                  ) : (
                    datum.x
                  )}
                </div>
                <div className="graph-bar__chart" data-test={`bar-chart-${index}`}>
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
              </Fragment>
            ))}
          </div>
        ) : (
          <GraphEmpty loading={loading} />
        )}
      </PrometheusGraphLink>
    </PrometheusGraph>
  );
};

export const Bar: FC<BarProps> = ({
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
  customDataSource,
}) => {
  const [response, , loading] = usePrometheusPoll({
    delay,
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query,
    customDataSource,
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
  LabelComponent?: ComponentType<LabelComponentProps>;
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
  LabelComponent?: ComponentType<LabelComponentProps>;
  metric: string;
  namespace?: string;
  noLink?: boolean;
  query: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  title?: string;
  titleClassName: string;
  customDataSource?: CustomDataSource;
};
