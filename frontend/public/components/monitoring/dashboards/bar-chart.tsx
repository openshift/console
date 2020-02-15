import * as _ from 'lodash-es';
import * as React from 'react';

import { Bar } from '../../graphs';

const Label = ({ metric }) => <>{_.values(metric).join()}</>;

const BarChart: React.FC<{ query: string }> = ({ query }) => (
  <Bar barSpacing={5} barWidth={8} query={query} LabelComponent={Label} />
);

export default BarChart;
