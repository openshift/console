import * as React from 'react';

import { FormatLegendLabel, QueryBrowser } from '../query-browser';

const Graph: React.FC<Props> = ({
  formatLegendLabel,
  isStack,
  pollInterval,
  queries,
  timespan,
}) => (
  <QueryBrowser
    defaultSamples={30}
    formatLegendLabel={formatLegendLabel}
    hideControls
    isStack={isStack}
    pollInterval={pollInterval}
    queries={queries}
    timespan={timespan}
  />
);

type Props = {
  formatLegendLabel?: FormatLegendLabel;
  isStack: boolean;
  pollInterval: number;
  queries: string[];
  timespan: number;
};

export default Graph;
