import * as React from 'react';
import { Helmet } from 'react-helmet';
import MetricsQueryInput from './MetricsQueryInput';
import { connect } from 'react-redux';
import { getURLSearchParams } from '@console/internal/components/utils';
import { queryBrowserRunQueries, queryBrowserPatchQuery } from '@console/internal/actions/ui';
import { QueryObj } from '@console/internal/components/monitoring/query-browser';
import ConnectedMetricsChart from './MetricsChart';

type MonitoringMetricsProps = {
  patchQuery?: (patch: QueryObj) => void;
  runQueries?: () => never;
};

export const MonitoringMetrics: React.FC<MonitoringMetricsProps> = ({ patchQuery, runQueries }) => {
  const params = getURLSearchParams();
  const query = params.query0;
  React.useEffect(() => {
    if (query) {
      patchQuery({ text: query });
      runQueries();
    }
  }, [query, patchQuery, runQueries]);

  return (
    <>
      <Helmet>
        <title>Metrics</title>
      </Helmet>
      <div className="co-m-pane__body">
        <MetricsQueryInput query={query} />
        <div className="row">
          <div className="col-xs-12">
            <ConnectedMetricsChart />
          </div>
        </div>
      </div>
    </>
  );
};

const mapDispatchToProps = (dispatch) => ({
  runQueries: () => dispatch(queryBrowserRunQueries()),
  patchQuery: (v: QueryObj) => dispatch(queryBrowserPatchQuery(0, v)),
});

export default connect(null, mapDispatchToProps)(MonitoringMetrics);
