import * as React from 'react';
import { connect } from 'react-redux';

import { RootState } from '../../../redux';
import { FormatLegendLabel, QueryBrowser } from '../query-browser';

const Graph_: React.FC<Props> = ({
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
const Graph = connect(({ UI }: RootState) => ({
  timespan: UI.getIn(['monitoringDashboards', 'timespan']),
}))(Graph_);

type Props = {
  formatLegendLabel?: FormatLegendLabel;
  isStack: boolean;
  pollInterval: number;
  queries: string[];
  timespan: number;
};

export default Graph;
