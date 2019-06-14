import * as _ from 'lodash-es';
import * as React from 'react';
import { ChartBarIcon } from '@patternfly/react-icons';
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartLabel,
  ChartThemeColor,
  ChartThemeVariant,
  getCustomTheme,
} from '@patternfly/react-charts';

import { useRefWidth } from '../utils/ref-width-hook';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph } from './prometheus-graph';
import { barTheme } from './themes';
import { humanizeNumber } from '../utils';
import {
  DataPoint,
  DomainPadding,
  MutatorFunction,
  PrometheusResponse,
} from '.';

const BAR_PADDING = 8; // Space between each bar (top and bottom)
const BAR_LABEL_PADDING = 8;
const DEFAULT_BAR_WIDTH = 10;
const DEFAULT_DOMAIN_PADDING: DomainPadding = { x: [20, 10] };
const PADDING_RATIO = 1 / 3;

const handleResponse = (response: PrometheusResponse, metric: string, formatY: MutatorFunction): DataPoint[] => {
  const results = _.get(response, 'data.result', []);
  return _.map(results, r => {
    const y = _.get(r, 'value[1]');
    return {
      label: formatY(y),
      x: _.get(r, ['metric', metric], ''),
      y,
    };
  });
};

export const Bar: React.FC<BarProps> = ({
  barWidth = DEFAULT_BAR_WIDTH,
  domainPadding = DEFAULT_DOMAIN_PADDING,
  formatY = humanizeNumber,
  metric,
  namespace,
  query,
  theme = getCustomTheme(ChartThemeColor.blue, ChartThemeVariant.light, barTheme),
  title,
}) => {
  const [containerRef, width] = useRefWidth();
  const [response] = usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY, namespace, query });
  const data = handleResponse(response, metric, formatY);

  // Max space that horizontal padding should take up. By default, 2/3 of the horizontal space is always available for the actual bar graph.
  const maxHorizontalPadding = PADDING_RATIO * width;

  // SVG text element is slightly taller than font size
  const xAxisTickLabelHeight = _.get(theme, 'independentAxis.style.tickLabels.fontSize') || _.get(theme, 'axis.style.tickLabels.fontSize', 14) * 1.25;
  const barFootprint = barWidth + xAxisTickLabelHeight + BAR_PADDING + BAR_LABEL_PADDING;
  const topPadding = xAxisTickLabelHeight + BAR_LABEL_PADDING; // Moving the label above the bar

  // Calculate total graph height, accounting for domain padding.
  const height = barFootprint * data.length + topPadding;
  const padding = {
    bottom: 0,
    left: 0,
    right: Math.min(100, maxHorizontalPadding),
    top: topPadding,
  };
  const tickLabelComponent = <ChartLabel x={0} verticalAnchor="start" transform={`translate(0, -${xAxisTickLabelHeight + BAR_LABEL_PADDING})`} />;
  const labelComponent = <ChartLabel x={width} />;

  return <PrometheusGraph ref={containerRef} title={title} query={query}>
    { data.length
      ? <Chart domainPadding={domainPadding} height={height} theme={theme} width={width} padding={padding}>
        <ChartBar barWidth={barWidth} data={data} horizontal labelComponent={labelComponent} />
        <ChartAxis tickLabelComponent={tickLabelComponent} />
      </Chart>
      : <EmptyState className="graph-empty-state" variant={EmptyStateVariant.full}>
        <EmptyStateIcon size="sm" icon={ChartBarIcon} />
        <Title size="sm">No Prometheus datapoints found.</Title>
      </EmptyState>
    }
  </PrometheusGraph>;
};

type BarProps = {
  barWidth?: number;
  domainPadding?: DomainPadding;
  formatY?: (val: number | string) => string;
  metric: string;
  namespace?: string;
  query: string;
  theme?: any; // TODO figure out the best way to import VictoryThemeDefinition
  title?: string;
  spacing?: number;
}
