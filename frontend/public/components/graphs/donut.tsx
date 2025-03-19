/* eslint-disable camelcase */
import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts/victory';
import {
  chart_color_black_100,
  chart_color_green_300,
  chart_color_green_500,
  chart_color_yellow_400,
  chart_color_yellow_500,
} from '@patternfly/react-tokens';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { useRefWidth } from '../utils';
import { DataPoint } from '.';

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  query = '',
  title,
  ariaChartLinkLabel,
  ariaChartTitle,
  ariaDescription,
  usedLabel,
  // Don't sort, Uses previously declared props
  label,
  secondaryTitle,
  className,
}) => {
  const { t } = useTranslation();
  const [ref, width] = useRefWidth();

  const usedLabelText = usedLabel || t('public~used');
  const secondaryTitleText = secondaryTitle || usedLabelText;
  const labelText = label || t('No data');

  const labels = ({ datum: { x, y } }) => t('public~{{x}}: {{y}}%', { x, y });

  const namespaceData = data.filter((datum) => datum.x === 'Namespace');

  return (
    <PrometheusGraph
      className={classNames('graph-wrapper--title-center graph-wrapper--gauge', className)}
      ref={ref}
      title={title}
    >
      <PrometheusGraphLink query={query} ariaChartLinkLabel={ariaChartLinkLabel}>
        <ChartDonut
          ariaTitle={ariaChartTitle || title}
          ariaDesc={ariaDescription}
          data={data}
          height={width} // Changes the scale of the graph, not actual width and height
          padding={0}
          labels={labels}
          width={width}
          subTitle={secondaryTitleText}
          colorScale={
            namespaceData[0]?.y === 100
              ? [
                  chart_color_yellow_400.value,
                  chart_color_yellow_500.value,
                  chart_color_black_100.value,
                ]
              : [
                  chart_color_green_300.value,
                  chart_color_green_500.value,
                  chart_color_black_100.value,
                ]
          }
          title={labelText}
        />
      </PrometheusGraphLink>
    </PrometheusGraph>
  );
};

type DonutChartProps = {
  data: DataPoint[];
  label: string;
  query?: string;
  secondaryTitle?: string;
  title?: string;
  ariaChartLinkLabel?: string;
  ariaChartTitle?: string;
  ariaDescription?: string;
  usedLabel?: string;
  className?: string;
};
