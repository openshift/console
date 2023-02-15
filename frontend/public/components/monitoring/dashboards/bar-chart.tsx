import * as _ from 'lodash-es';
import * as React from 'react';

import { Bar } from '../../graphs';

import { CustomDataSource } from '@console/dynamic-plugin-sdk/src/extensions/dashboard-data-source';

const Label = ({ metric }) => <>{_.values(metric).join()}</>;

const BarChart: React.FC<BarChartProps> = ({ pollInterval, query, customDataSource }) => (
  <Bar
    barSpacing={5}
    barWidth={8}
    delay={pollInterval}
    LabelComponent={Label}
    noLink={true}
    query={query}
    customDataSource={customDataSource}
  />
);

type BarChartProps = {
  pollInterval: number;
  query: string;
  namespace?: string;
  customDataSource?: CustomDataSource;
};
export default BarChart;
