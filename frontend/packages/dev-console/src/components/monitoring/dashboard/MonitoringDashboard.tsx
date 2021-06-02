import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { match as RMatch } from 'react-router-dom';
import {
  TimespanDropdown,
  PollIntervalDropdown,
} from '@console/internal/components/monitoring/dashboards';
import {
  getURLSearchParams,
  setQueryArguments,
  removeQueryArguments,
} from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import {
  monitoringDashboardQueries,
  workloadMetricsQueries,
  topWorkloadMetricsQueries,
} from '../queries';
import ConnectedMonitoringDashboardGraph from './MonitoringDashboardGraph';
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
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const params = getURLSearchParams();
  const [workloadName, setWorkloadName] = React.useState(
    params.workloadName || OptionTypes.selectAll,
  );
  const [workloadType, setWorkloadType] = React.useState(params.workloadType);

  const queries = React.useMemo(() => {
    return workloadName && workloadType && workloadName !== OptionTypes.selectAll
      ? [...topWorkloadMetricsQueries(t), ...workloadMetricsQueries(t)]
      : monitoringDashboardQueries(t);
  }, [t, workloadName, workloadType]);

  const onSelect = React.useCallback(
    (key: string, type: string = null): void => {
      setWorkloadName(key);
      setWorkloadType(type);
      if (key && type && key !== OptionTypes.selectAll) {
        setQueryArguments({
          workloadName: key,
          workloadType: type,
        });
      } else {
        removeQueryArguments('workloadName', 'workloadType');
      }
    },
    [setWorkloadType, setWorkloadName],
  );

  return (
    <>
      <Helmet>
        <title>{t('devconsole~Dashboard')}</title>
      </Helmet>
      <div className="odc-monitoring-dashboard">
        <div className="odc-monitoring-dashboard__resource-toolbar">
          <div className="odc-monitoring-dashboard__workload">
            <label htmlFor="odc-monitoring-dashboard-workload-filter">
              {t('devconsole~Workload')}
            </label>
            <MonitoringWorkloadFilter
              name={workloadName}
              namespace={namespace}
              onChange={onSelect}
            />
          </div>
          <div className="odc-monitoring-dashboard__dropdown-options">
            <div className="odc-monitoring-dashboard__dropdown-time-interval">
              <TimespanDropdown />
              <PollIntervalDropdown />
            </div>
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
