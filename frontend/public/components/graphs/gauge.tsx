import * as React from 'react';
import { ChartDonutThreshold, ChartDonutUtilization, ChartThemeColor } from '@patternfly/react-charts';

import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { useRefWidth, humanizePercentage, Humanize } from '../utils';
import { getInstantVectorStats } from './utils';

const DEFAULT_THRESHOLDS = [{ value: 67 }, { value: 92 }];

export const GaugeChart: React.FC<GaugeChartProps> = ({
  data,
  error = false,
  invert = false,
  label,
  loading,
  query = '',
  remainderLabel = 'available',
  theme,
  thresholds = DEFAULT_THRESHOLDS,
  title,
  usedLabel = 'used',

  // Don't sort, Uses previously declared props
  secondaryTitle = usedLabel,
}) => {
  const [ref, width] = useRefWidth();
  const labels = (d) => d.x ? `${d.x} ${usedLabel}` : `${d.y} ${remainderLabel}`;
  return <PrometheusGraph className="graph-wrapper--title-center graph-wrapper--gauge" ref={ref} title={title}>
    <PrometheusGraphLink query={query}>
      <ChartDonutThreshold
        data={thresholds}
        height={width} // Changes the scale of the graph, not actual width and height
        y="value"
        width={width}
      >
        <ChartDonutUtilization
          labels={labels}
          data={error ? { y: 0 } : data}
          invert={invert}
          subTitle={error || loading ? null : secondaryTitle}
          themeColor={ChartThemeColor.green}
          thresholds={thresholds}
          title={loading ? 'Loading' : error ? 'No Data' : label}
          theme={theme}
        />
      </ChartDonutThreshold>
    </PrometheusGraphLink>
  </PrometheusGraph>;
};

export const Gauge: React.FC<GaugeProps> = ({
  humanize = humanizePercentage,
  invert,
  namespace,
  percent = 0,
  query,
  remainderLabel,
  secondaryTitle,
  theme,
  thresholds,
  title,
  usedLabel,
}) => {
  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query,
  });

  const [data] = response ? (
    getInstantVectorStats(response, null, humanize).map(({ label, y }) => ({ x: label, y }))
  ) : (
    [{ x: humanize(percent).string, y: percent }]
  );
  return <GaugeChart
    data={data}
    error={!!error}
    invert={invert}
    label={data.x}
    loading={loading}
    query={query}
    remainderLabel={remainderLabel}
    secondaryTitle={secondaryTitle}
    theme={theme}
    thresholds={thresholds}
    title={title}
    usedLabel={usedLabel}
  />;
};

type GaugeChartProps = {
  data: {
    x: string,
    y: React.ReactText,
  };
  error?: boolean;
  invert?: boolean;
  isLoaded?: boolean;
  label: string;
  loading?: boolean;
  query?: string;
  remainderLabel?: string;
  secondaryTitle?: string;
  theme?: any;
  thresholds?: {
    value: number;
    color?: string;
  }[];
  title?: string;
  usedLabel?: string;
}

type GaugeProps = {
  humanize?: Humanize;
  namespace?: string;
  percent?: number;
  invert?: boolean;
  remainderLabel?: string,
  query?: string,
  thresholds?: {
    value: number;
    color?: string;
  }[];
  title?: string,
  usedLabel?: string,
  theme?: any,
  secondaryTitle?: string,
}
