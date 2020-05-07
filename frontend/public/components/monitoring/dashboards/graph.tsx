import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';

import * as UIActions from '../../../actions/ui';
import { RootState } from '../../../redux-types';
import { FormatLegendLabel, PatchQuery, QueryBrowser } from '../query-browser';

// Set the queries in Redux so that other components like the graph tooltip can access them
const patchAllQueries = (queries: string[], patchQuery: PatchQuery): void => {
  _.each(queries, (query, i) => patchQuery(i, { query }));
};

const Graph_: React.FC<Props> = ({
  formatLegendLabel,
  isStack,
  patchQuery,
  pollInterval,
  queries,
  timespan,
}) => (
  <div onMouseEnter={() => patchAllQueries(queries, patchQuery)}>
    <QueryBrowser
      defaultSamples={30}
      formatLegendLabel={formatLegendLabel}
      hideControls
      isStack={isStack}
      pollInterval={pollInterval}
      queries={queries}
      timespan={timespan}
    />
  </div>
);
const Graph = connect(({ UI }: RootState) => ({
  timespan: UI.getIn(['monitoringDashboards', 'timespan']),
}))(Graph_);

type Props = {
  formatLegendLabel?: FormatLegendLabel;
  isStack: boolean;
  patchQuery: PatchQuery;
  pollInterval: number;
  queries: string[];
  timespan: number;
};

export default connect(null, { patchQuery: UIActions.queryBrowserPatchQuery })(Graph);
