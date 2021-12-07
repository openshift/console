import * as React from 'react';
import {
  ChartDonutThreshold,
  ChartDonutUtilization,
  ChartThemeColor,
} from '@patternfly/react-charts';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { useRefWidth, humanizePercentage, Humanize } from '../utils';
import { getInstantVectorStats } from './utils';
import { DataPoint } from '.';

const DEFAULT_THRESHOLDS = [{ value: 67 }, { value: 92 }];

export const GaugeChart: React.FC<GaugeChartProps> = ({
  data,
  error,
  humanize = humanizePercentage,
  invert = false,
  loading,
  query = '',
  remainderLabel,
  themeColor = ChartThemeColor.green,
  thresholds = DEFAULT_THRESHOLDS,
  title,
  ariaChartLinkLabel,
  ariaChartTitle,
  usedLabel,
  // Don't sort, Uses previously declared props
  label,
  secondaryTitle,
  className,
}) => {
  const { t } = useTranslation();
  const [ref, width] = useRefWidth();
  const ready = !error && !loading;

  const status = loading ? t('Loading') : error;
  const usedLabelText = usedLabel || t('public~used');
  const secondaryTitleText = secondaryTitle || usedLabelText;
  const labelText = label || data ? humanize(data.y).string : t('No data');

  const labels = ({ datum: { x, y } }) =>
    x ? `${x} ${usedLabelText}` : `${y} ${remainderLabel || t('available')}`;
  return (
    <PrometheusGraph
      className={classNames('graph-wrapper--title-center graph-wrapper--gauge', className)}
      ref={ref}
      title={title}
    >
      <PrometheusGraphLink query={query} ariaChartLinkLabel={ariaChartLinkLabel}>
        <ChartDonutThreshold
          ariaTitle={ariaChartTitle || title}
          data={thresholds}
          height={width} // Changes the scale of the graph, not actual width and height
          padding={0}
          width={width}
          y="value"
        >
          <ChartDonutUtilization
            labels={labels}
            data={ready ? data : { y: 0 }}
            invert={invert}
            padding={0}
            subTitle={ready ? secondaryTitleText : ''}
            themeColor={themeColor}
            thresholds={thresholds}
            title={status || labelText}
          />
        </ChartDonutThreshold>
      </PrometheusGraphLink>
    </PrometheusGraph>
  );
};

export const Gauge: React.FC<GaugeProps> = ({
  humanize = humanizePercentage,
  invert,
  namespace,
  percent = 0,
  query,
  remainderLabel,
  secondaryTitle,
  thresholds,
  title,
  usedLabel,
}) => {
  const { t } = useTranslation();

  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query,
  });

  const [data] = response
    ? getInstantVectorStats(response, null, humanize).map(({ label, y }) => ({ x: label, y }))
    : [{ x: humanize(percent).string, y: percent }];
  return (
    <GaugeChart
      data={data}
      error={!!error && t('No data')}
      invert={invert}
      label={data.x}
      loading={loading}
      query={query}
      remainderLabel={remainderLabel}
      secondaryTitle={secondaryTitle}
      thresholds={thresholds}
      title={title}
      usedLabel={usedLabel}
    />
  );
};

type GaugeChartProps = {
  data: DataPoint;
  error?: string;
  humanize?: Humanize;
  invert?: boolean;
  isLoaded?: boolean;
  label: string;
  loading?: boolean;
  query?: string;
  remainderLabel?: string;
  secondaryTitle?: string;
  themeColor?: string;
  thresholds?: {
    value: number;
    color?: string;
  }[];
  title?: string;
  ariaChartLinkLabel?: string;
  ariaChartTitle?: string;
  usedLabel?: string;
  className?: string;
};

type GaugeProps = {
  humanize?: Humanize;
  invert?: boolean;
  namespace?: string;
  percent?: number;
  query?: string;
  remainderLabel?: string;
  secondaryTitle?: string;
  thresholds?: {
    value: number;
    color?: string;
  }[];
  title?: string;
  usedLabel?: string;
};
