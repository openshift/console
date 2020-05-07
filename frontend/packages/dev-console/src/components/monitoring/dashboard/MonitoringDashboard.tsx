import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { RootState } from '@console/internal/redux-types';
import { getURLSearchParams, ResourceLink } from '@console/internal/components/utils';
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
  const workLoadPresent = workloadName && workloadType;
  const queries: MonitoringQuery[] = workLoadPresent
    ? [...topWorkloadMetricsQueries, ...workloadMetricsQueries]
    : monitoringDashboardQueries;

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <div className="odc-monitoring-dashboard">
        <div className="odc-monitoring-dashboard__dropdown-options">
          <TimespanDropdown />
          <PollIntervalDropdown />
        </div>
        {workLoadPresent && (
          <div className="odc-monitoring-dashboard__resource-link">
            Showing metrics for &nbsp;
            <ResourceLink
              kind={workloadType}
              name={workloadName}
              namespace={namespace}
              title={workloadName}
              inline
            />
          </div>
        )}
        <Dashboard>
          {_.map(queries, (q) => (
            <ConnectedMonitoringDashboardGraph
              title={q.title}
              namespace={namespace}
              graphType={q.chartType}
              query={q.query({ namespace, workloadName, workloadType: _.toLower(workloadType) })}
              humanize={q.humanize}
              byteDataType={q.byteDataType}
              key={q.title}
              timespan={timespan}
              pollInterval={pollInterval}
            />
          ))}
        </Dashboard>
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  timespan: state.UI.getIn(['monitoringDashboards', 'timespan']),
  pollInterval: state.UI.getIn(['monitoringDashboards', 'pollInterval']),
});

export default connect<StateProps, MonitoringDashboardProps>(mapStateToProps)(MonitoringDashboard);
