import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux-types';
import { queryBrowserDeleteAllQueries } from '@console/internal/actions/ui';
import { getActiveNamespace } from '@console/internal/reducers/ui-selectors';
import {
  QueryBrowser,
  QueryObj,
  QueryBrowserProps,
} from '@console/internal/components/monitoring/query-browser';
import { QueryTable } from '@console/internal/components/monitoring/metrics';
import EmptyStateQuery from './EmptyStateQuery';
import './MetricsChart.scss';

type StateProps = {
  queries: QueryObj[];
  namespace: string;
};
type MetricsChartProps = {
  deleteAll?: () => never;
  queries: QueryObj[];
  namespace: string;
};
const DEFAULT_TIME_SPAN = 30 * 60 * 1000;

export const MetricsChart: React.FC<MetricsChartProps> = ({ deleteAll, queries, namespace }) => {
  const [queryStrings, setQueryStrings] = React.useState<QueryBrowserProps['queries']>([]);
  const [disabledSeries, setDisabledSeries] = React.useState<QueryBrowserProps['disabledSeries']>(
    [],
  );
  // TO delete all queries patched on componenet unmount
  React.useEffect(() => deleteAll, [deleteAll]);
  React.useEffect(() => {
    setQueryStrings((prev) => {
      const next = _.compact(_.map(queries, 'query'));
      return _.isEqual(prev, next) ? prev : next;
    });
    setDisabledSeries((prev) => {
      const next = _.compact(_.map(queries, 'disabledSeries'));
      return _.isEqual(prev, next) ? prev : next;
    });
  }, [queries]);
  return queryStrings.length === 0 ? (
    <EmptyStateQuery />
  ) : (
    <div className="odc-metrics-chart">
      <QueryBrowser
        defaultTimespan={DEFAULT_TIME_SPAN}
        disabledSeries={disabledSeries}
        namespace={namespace}
        queries={queryStrings}
      />
      <QueryTable index={0} namespace={namespace} />
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  queries: state.UI.getIn(['queryBrowser', 'queries']).toJS(),
  namespace: getActiveNamespace(state),
});

export default connect(mapStateToProps, { deleteAll: queryBrowserDeleteAllQueries })(MetricsChart);
