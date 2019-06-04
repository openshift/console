import * as _ from 'lodash-es';
import * as React from 'react';
import { Chart, ChartBar, ChartThemeVariant, ChartThemeColor, getCustomTheme, ChartAxis, ChartLabel } from '@patternfly/react-charts';

import { useRefWidth } from '../utils/ref-width-hook';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { PrometheusGraph } from './prometheus-graph';
import { barTheme } from './themes';
import { humanizeNumber, truncateMiddle } from '../utils';
import { EmptyState, EmptyStateVariant, EmptyStateIcon, Title } from '@patternfly/react-core';
import { ChartBarIcon } from '@patternfly/react-icons';
import { MutatorFunction, DataPoint, PrometheusResponse, DomainPadding } from '.';

const DEFAULT_SPACING: number = 10;
const DEFAULT_BAR_WIDTH: number = 10;
const DEFAULT_DOMAIN_PADDING: DomainPadding = { x: [20, 10]};
const PADDING_RATIO: number = 1 / 3;

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

const getTotalXDomainPadding = (domainPadding: DomainPadding): number => {
  const value = _.get(domainPadding, 'x', domainPadding);
  if (_.isArray(value)) {
    return _.sum(value);
  }
  if (_.isFinite(value)) {
    return value * 2;
  }
  return 0;
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
  spacing = DEFAULT_SPACING,
}) => {
  const [containerRef, width] = useRefWidth();
  const [response] = usePrometheusPoll({ endpoint: PrometheusEndpoint.QUERY, namespace, query });
  const data = handleResponse(response, metric, formatY);

  // Max space that horizontal padding should take up. By default, 1/3 of the horizontal space is always available for the actual bar graph.
  const maxHorizontalPadding = PADDING_RATIO * width;

  // Get total x-axis domain padding (top and bottom in this case, since graph is horizontal)
  const totalXDomainPadding = getTotalXDomainPadding(domainPadding);

  // Calculate total graph height, accounting for domain padding.
  const height = ((spacing + barWidth) * data.length) + totalXDomainPadding;
  const padding = {
    bottom: 0,
    left: Math.min(110, maxHorizontalPadding),
    right: Math.min(100, maxHorizontalPadding),
    top: 0,
  };
  const tickFormat = (tick) => truncateMiddle(tick.toString(), 15);
  const tickLabelComponent = <ChartLabel x={0} />;
  const labelComponent = <ChartLabel x={width} />;

  return <PrometheusGraph ref={containerRef} title={title} query={query}>
    { data.length
      ? <Chart domainPadding={domainPadding} height={height} theme={theme} width={width} padding={padding}>
        <ChartBar barWidth={barWidth} data={data} horizontal labelComponent={labelComponent} />
        <ChartAxis tickFormat={tickFormat} tickLabelComponent={tickLabelComponent} />
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
