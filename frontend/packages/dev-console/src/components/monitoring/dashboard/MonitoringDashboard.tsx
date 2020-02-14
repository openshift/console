import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getURLSearchParams } from '@console/internal/components/utils';
import ConnectedMonitoringDashboardGraph from './MonitoringDashboardGraph';
import {
  monitoringDashboardQueries,
  workloadMetricsQueries,
  MonitoringQuery,
  topWorkloadMetricsQueries,
} from '../queries';

interface MonitoringDashboardProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ match }) => {
  const namespace = match.params.ns;
  const params = getURLSearchParams();
  const { workloadName, workloadType } = params;
  const queries: MonitoringQuery[] =
    workloadName && workloadType
      ? [...topWorkloadMetricsQueries, ...workloadMetricsQueries]
      : monitoringDashboardQueries;

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <div className="co-m-pane__body">
        {_.map(queries, (q) => (
          <ConnectedMonitoringDashboardGraph
            title={q.title}
            namespace={namespace}
            graphType={q.chartType}
            query={q.query({ namespace, workloadName, workloadType })}
            humanize={q.humanize}
            byteDataType={q.byteDataType}
            key={q.title}
          />
        ))}
      </div>
    </>
  );
};

export default MonitoringDashboard;
