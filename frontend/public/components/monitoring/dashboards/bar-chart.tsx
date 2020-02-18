import * as _ from 'lodash-es';
import * as React from 'react';

import { Bar } from '../../graphs';

const Label = ({ metric }) => <>{_.values(metric).join()}</>;

const BarChart: React.FC<BarChartProps> = ({ pollInterval, query }) => (
  <Bar barSpacing={5} barWidth={8} delay={pollInterval} query={query} LabelComponent={Label} />
);

type BarChartProps = {
  pollInterval: number;
  query: string;
};
export default BarChart;
