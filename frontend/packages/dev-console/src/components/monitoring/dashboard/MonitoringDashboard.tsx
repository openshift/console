import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { RootState } from '@console/internal/redux';
import { getURLSearchParams } from '@console/internal/components/utils';
import {
  TimespanDropdown,
  PollIntervalDropdown,
} from '@console/internal/components/monitoring/dashboards';
import ConnectedMonitoringDashboardGraph from './MonitoringDashboardGraph';
import {
  monitoringDashboardQueries,
  workloadMetricsQueries,
  MonitoringQuery,
  topWorkloadMetricsQueries,
} from '../queries';
import './MonitoringDashboard.scss';

type MonitoringDashboardProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

type StateProps = {
  timespan: number;
  pollInterval: number;
};

type Props = MonitoringDashboardProps & StateProps;

export const MonitoringDashboard: React.FC<Props> = ({ match, timespan, pollInterval }) => {
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
      <div className="odc-monitoring-dashboard__dropdown-options">
        <TimespanDropdown />
        <PollIntervalDropdown />
      </div>
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
            timespan={timespan}
            pollInterval={pollInterval}
          />
        ))}
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  timespan: state.UI.getIn(['monitoringDashboards', 'timespan']),
  pollInterval: state.UI.getIn(['monitoringDashboards', 'pollInterval']),
});

export default connect<StateProps, MonitoringDashboardProps>(mapStateToProps)(MonitoringDashboard);
