import * as _ from 'lodash';
import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts';
import {
  /* eslint-disable camelcase */
  chart_color_blue_100 as blue100,
  chart_color_blue_200 as blue200,
  chart_color_blue_300 as blue300,
  /* eslint-enable camelcase */
} from '@patternfly/react-tokens';
import { useRefWidth } from '@console/internal/components/utils';
import { Descriptor } from '../types';

const colorScale = [blue300.value, blue200.value, blue100.value];

export const PodStatusChart: React.SFC<PodStatusChartProps> = ({ statuses, statusDescriptor }) => {
  const [ref, width] = useRefWidth();
  const data = _.map(statuses, (podList, status) => {
    const x = status;
    const y = podList.length;
    return {
      label: `${y} ${x}`,
      x,
      y,
    };
  });
  const total = data.reduce((sum, dataPoint) => sum + dataPoint.y, 0);

  return (
    <div ref={ref} className="graph-wrapper--gauge">
      <ChartDonut
        colorScale={colorScale}
        data={data}
        height={width}
        title={total.toString()}
        width={width}
        radius={58.75}
      />
      {/* Use instead of `subTitle` on <ChartDonut> so long paths do not clip  */}
      <div className="graph-donut-subtitle" data-test-id="chart-donut-subtitle">
        {statusDescriptor.path}
      </div>
    </div>
  );
};

export type PodStatusChartProps = {
  statusDescriptor: Descriptor;
  statuses: { [key: string]: string[] };
};

PodStatusChart.displayName = 'PodStatusChart';
