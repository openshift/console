import * as React from 'react';

import { QueryBrowser } from '../query-browser';

const Graph: React.FC<Props> = ({ pollInterval, queries, timespan }) => (
  <QueryBrowser
    defaultSamples={30}
    hideControls
    pollInterval={pollInterval}
    queries={queries}
    timespan={timespan}
  />
);

type Props = {
  pollInterval: number;
  queries: string[];
  timespan: number;
};

export default Graph;
