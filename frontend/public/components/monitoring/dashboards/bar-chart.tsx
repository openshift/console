import * as React from 'react';

import { Bar } from '../../graphs';

const BarChart: React.FC<{ query: string }> = ({ query }) => <Bar query={query} />;

export default BarChart;
