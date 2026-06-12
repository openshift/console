import type { FC } from 'react';
import {
  ChartDonutThreshold,
  ChartDonutUtilization,
  ChartThemeColor,
} from '@patternfly/react-charts/victory';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';

import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { humanizePercentage } from '../utils/units';
import { useRefWidth } from '../utils/ref-width-hook';
import type { Humanize } from '../utils/types';
import { DataPoint } from '.';

const DEFAULT_THRESHOLDS = [{ value: 67 }, { value: 92 }];

export const GaugeChart: FC<GaugeChartProps> = ({
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
  const { t } = useTranslation('public');
  const [ref, width] = useRefWidth();
  const ready = !error && !loading;

  const status = loading ? t('Loading') : error;
  const usedLabelText = usedLabel || t('used');
  const secondaryTitleText = secondaryTitle || usedLabelText;
  const labelText = label || (data ? humanize(data.y).string : undefined) || t('No data');

  const labels = ({ datum: { x, y } }) =>
    x ? `${x} ${usedLabelText}` : `${y} ${remainderLabel || t('available')}`;
  return (
    <PrometheusGraph
      className={css('graph-wrapper--title-center graph-wrapper--gauge', className)}
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
          data-test="gauge-chart"
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

type GaugeChartProps = {
  data: DataPoint;
  error?: string;
  humanize?: Humanize;
  invert?: boolean;
  isLoaded?: boolean;
  label?: string;
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
