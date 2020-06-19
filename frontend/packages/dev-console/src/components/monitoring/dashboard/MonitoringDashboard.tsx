import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router-dom';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { RootState } from '@console/internal/redux';
import {
  getURLSearchParams,
  setQueryArgument,
  removeQueryArgument,
} from '@console/internal/components/utils';
import {
  TimespanDropdown,
  PollIntervalDropdown,
} from '@console/internal/components/monitoring/dashboards';
import ConnectedMonitoringDashboardGraph from './MonitoringDashboardGraph';
import {
  monitoringDashboardQueries,
  workloadMetricsQueries,
  topWorkloadMetricsQueries,
} from '../queries';
import { MonitoringWorkloadFilter, OptionTypes } from './MonitoringWorkloadFilter';
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
  const [workloadName, setWorkloadName] = React.useState(
    params.workloadName || OptionTypes.selectAll,
  );
  const [workloadType, setWorkloadType] = React.useState(params.workloadType);
  const [initialRun, setInitialRun] = React.useState(true);
  const selectedTaskRef = React.useRef<string>(workloadName);
  selectedTaskRef.current = workloadName;

  const getQueries = React.useCallback(() => {
    return workloadName && workloadType && workloadName !== OptionTypes.selectAll
      ? [...topWorkloadMetricsQueries, ...workloadMetricsQueries]
      : monitoringDashboardQueries;
  }, [workloadName, workloadType]);

  const [queries, setQueries] = React.useState(getQueries());

  const removeQueryParams = React.useCallback(() => {
    if (!initialRun) {
      removeQueryArgument('workloadName');
      removeQueryArgument('workloadType');
      setWorkloadType(null);
      setWorkloadName(OptionTypes.selectAll);
      setQueries(getQueries());
    }
  }, [getQueries, initialRun]);

  React.useEffect(
    () => {
      setQueries(getQueries());
      if (workloadName !== OptionTypes.selectAll && workloadType) {
        setQueryArgument('workloadName', workloadName);
        setQueryArgument('workloadType', workloadType);
      } else if (
        workloadName === OptionTypes.selectAll &&
        !initialRun &&
        !_.isEmpty(getURLSearchParams())
      ) {
        removeQueryParams();
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [workloadName, workloadType, getQueries, namespace],
  );

  React.useEffect(
    () => {
      initialRun ? setInitialRun(false) : removeQueryParams();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespace],
  );

  const onSelect = React.useCallback(
    (key: string, type: string = null): void => {
      if (selectedTaskRef.current !== key) {
        selectedTaskRef.current = key;
        setWorkloadName(key);
        setWorkloadType(type);
      }
    },
    [setWorkloadType, setWorkloadName],
  );

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
        <div className="row odc-monitoring-dashboard__resource-toolbar">
          <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
            <MonitoringWorkloadFilter
              name={workloadName}
              namespace={namespace}
              onChange={onSelect}
            />
          </div>
        </div>
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
