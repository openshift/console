import * as _ from 'lodash-es';
import * as React from 'react';
import { ChartDonutThreshold, ChartDonutUtilization } from '@patternfly/react-charts';

import { PrometheusGraph, PrometheusGraphLink } from './prometheus-graph';
import { usePrometheusPoll } from './prometheus-poll-hook';
import { PrometheusEndpoint } from './helpers';
import { useRefWidth, humanizePercentage } from '../utils';
import { MutatorFunction, PrometheusResponse, ThresholdColor } from '.';

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

const handleResponse = (response: PrometheusResponse): number => {
  return parseFloat(_.get(response, 'data.result[0].value[1]', 0));
};

export const Gauge: React.FC<GaugeProps> = ({
  formatY = humanizePercentage,
  invert = false,
  label = '',
  namespace,
  percent = 0,
  remainderLabel = 'available',
  query = '',
  thresholds = DEFAULT_THRESHOLDS,
  title,
  usedLabel = 'used',
}) => {
  const [ref, width] = useRefWidth();
  const [response, error] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    namespace,
    query,
  });

  const used = response ? handleResponse(response) : percent;
  const data = { x: formatY(used/100), y: used };
  const labels = (d) => d.x ? `${d.x} ${usedLabel}` : `${formatY(d.y/100)} ${remainderLabel}`;
  return <PrometheusGraph className="graph-wrapper--title-center" title={title}>
    <div ref={ref} className="graph-wrapper--gauge">
      {
        error ? (
          <ChartDonutUtilization data={{y: 0}} title="No Data" labels={[]} />
        ) : (
          <PrometheusGraphLink query={query}>
            <ChartDonutThreshold
              data={thresholds}
              height={width} // Changes the scale of the graph, not actual width and height
              y="value"
              width={width}
            >
              <ChartDonutUtilization
                labels={labels}
                data={data}
                invert={invert}
                subTitle={usedLabel}
                thresholds={thresholds}
                title={label || formatY(used/100)}
              />
            </ChartDonutThreshold>
          </PrometheusGraphLink>
        )
      }
    </div>
  </PrometheusGraph>;
};

type GaugeProps = {
  formatY?: MutatorFunction;
  invert?: boolean;
  label?: string;
  namespace?: string;
  percent?: number;
  query?: string;
  remainderLabel?: string;
  theme?: any;
  thresholds?: {
    value: number;
    color: ThresholdColor;
  }[];
  title: string;
  usedLabel?: string;
}
