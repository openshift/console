import * as React from 'react';

import { QueryBrowser } from '../query-browser';

const Graph: React.FC<Props> = ({ isStack, pollInterval, queries, timespan }) => (
  <QueryBrowser
    defaultSamples={30}
    hideControls
    isStack={isStack}
    pollInterval={pollInterval}
    queries={queries}
    timespan={timespan}
  />
);

type Props = {
  isStack: boolean;
  pollInterval: number;
  queries: string[];
  timespan: number;
};

export default Graph;
