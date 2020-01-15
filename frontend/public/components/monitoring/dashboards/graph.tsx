import * as React from 'react';

import { QueryBrowser } from '../query-browser';

const Graph: React.FC<Props> = ({ isStack, pollInterval, queries, timespan }) => (
  <QueryBrowser
    defaultSamples={30}
    defaultTimespan={timespan}
    hideControls
    isStack={isStack}
    pollInterval={pollInterval}
    queries={queries}
  />
);

type Props = {
  isStack: boolean;
  pollInterval: number;
  queries: string[];
  timespan: number;
};

export default Graph;
