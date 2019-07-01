import * as React from 'react';
import { ChartDonutThreshold, ChartDonutUtilization } from '@patternfly/react-charts';

import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { useRefWidth, humanizePercentage, Humanize } from '../utils';
import { ThresholdColor } from '.';
import { getInstantVectorStats } from './utils';

const DEFAULT_THRESHOLDS = [
  {
    value: 67,
    color: ThresholdColor.WARN,
  },
  {
    value: 92,
    color: ThresholdColor.ERROR,
  },
];

export const GaugeChart: React.FC<GaugeChartProps> = ({
  query = '',
  thresholds = DEFAULT_THRESHOLDS,
  invert = false,
  usedLabel = 'used',
  label,
  remainderLabel = 'available',
  title,
  theme,
  data,
  secondaryTitle = usedLabel,
  error = false,
}) => {
  const [ref, width] = useRefWidth();
  const labels = (d) => d.x ? `${d.x} ${usedLabel}` : `${d.y} ${remainderLabel}`;
  return (
    <PrometheusGraph className="graph-wrapper--title-center" title={title}>
      <div ref={ref} className="graph-wrapper--gauge">
        <PrometheusGraphLink query={query}>
          <ChartDonutThreshold
            data={thresholds}
            height={width} // Changes the scale of the graph, not actual width and height
            y="value"
            width={width}
          >
            <ChartDonutUtilization
              labels={labels}
              data={error ? {y: 0}: data}
              invert={invert}
              subTitle={error ? null : secondaryTitle}
              thresholds={thresholds}
              title={error ? 'No Data' : label}
              theme={theme}
            />
          </ChartDonutThreshold>
        </PrometheusGraphLink>
      </div>
    </PrometheusGraph>
  );
};

export const Gauge: React.FC<GaugeProps> = ({
  humanize = humanizePercentage,
  invert,
  namespace,
  percent = 0,
  remainderLabel,
  query,
  thresholds,
  title,
  usedLabel,
  theme,
  secondaryTitle,
}) => {
  const [response, error] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query,
  });

  const data = response ?
    getInstantVectorStats(response, null, humanize).map(({label, y}) => ({x: label, y}))[0]
    : {x: humanize(percent).string, y: percent};
  return (
    <GaugeChart
      query={query}
      thresholds={thresholds}
      invert={invert}
      usedLabel={usedLabel}
      label={data.x}
      data={data}
      remainderLabel={remainderLabel}
      title={title}
      theme={theme}
      error={!!error}
      secondaryTitle={secondaryTitle}
    />
  );
};

type GaugeChartProps = {
  invert?: boolean;
  label: string;
  data: {
    x: string,
    y: React.ReactText,
  };
  query?: string;
  remainderLabel?: string;
  theme?: any;
  thresholds?: {
    value: number;
    color: ThresholdColor;
  }[];
  title?: string;
  usedLabel?: string;
  secondaryTitle?: string;
  error?: boolean;
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
    color: ThresholdColor;
  }[];
  title?: string,
  usedLabel?: string,
  theme?: any,
  secondaryTitle?: string,
}
