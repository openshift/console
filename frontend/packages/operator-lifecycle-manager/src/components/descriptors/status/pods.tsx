import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts/victory';
/* eslint-disable camelcase */
import { t_color_blue_50 as blue300 } from '@patternfly/react-tokens';
import { chart_color_blue_100 as blue100 } from '@patternfly/react-tokens/dist/js/chart_color_blue_100';
import { chart_color_blue_200 as blue200 } from '@patternfly/react-tokens/dist/js/chart_color_blue_200';
import * as _ from 'lodash';
/* eslint-enable camelcase */
import { useRefWidth } from '@console/internal/components/utils';
import { calculateRadius } from '@console/shared/';

const colorScale = [blue300.value, blue200.value, blue100.value];

export const PodStatusChart: React.FC<PodStatusChartProps> = ({ statuses, subTitle }) => {
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
  const { podStatusInnerRadius, podStatusOuterRadius } = calculateRadius(130); // default value of size is 130

  return (
    <div ref={ref} className="graph-wrapper--gauge">
      <ChartDonut
        colorScale={colorScale}
        constrainToVisibleArea
        data={data}
        height={width}
        title={total.toString()}
        width={width}
        innerRadius={podStatusInnerRadius}
        radius={podStatusOuterRadius}
      />
      {/* Use instead of `subTitle` on <ChartDonut> so long paths do not clip  */}
      <div className="graph-donut-subtitle" data-test-id="chart-donut-subtitle">
        {subTitle}
      </div>
    </div>
  );
};

export type PodStatusChartProps = {
  subTitle: string;
  statuses: { [key: string]: string[] };
};

PodStatusChart.displayName = 'PodStatusChart';
