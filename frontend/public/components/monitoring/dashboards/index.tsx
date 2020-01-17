import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';

import ErrorAlert from '@console/shared/src/components/alerts/error';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';

import * as UIActions from '../../../actions/ui';
import { k8sBasePath } from '../../../module/k8s';
import { ErrorBoundaryFallback } from '../../error';
import { RootState } from '../../../redux';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { Dropdown, LoadingInline, useSafeFetch } from '../../utils';
import { parsePrometheusDuration } from '../../utils/datetime';
import { withFallback } from '../../utils/error-boundary';
import BarChart from './bar-chart';
import Graph from './graph';
import SingleStat from './single-stat';
import Table from './table';
import { Panel } from './types';

const evaluateTemplate = (s: string, variables: VariablesMap) =>
  _.reduce(
    variables,
    (result: string, v: Variable, k: string): string => {
      return result.replace(new RegExp(`\\$${k}`, 'g'), v.value);
    },
    s,
  );

const VariableDropdown: React.FC<VariableDropdownProps> = ({
  buttonClassName,
  onChange,
  options,
  selected,
  title,
}) => (
  <div className="monitoring-dashboards__dropdown-wrap">
    {title && <h4>{title}</h4>}
    <Dropdown
      buttonClassName={buttonClassName}
      items={_.zipObject(options, options)}
      onChange={onChange}
      selectedKey={selected}
    />
  </div>
);

const AllVariableDropdowns_: React.FC<AllVariableDropdownsProps> = ({
  patchVariable,
  variables,
}) => (
  <>
    {_.map(variables, ({ options, value }, k) =>
      _.isEmpty(options) ? null : (
        <VariableDropdown
          key={k}
          onChange={(v: string) => patchVariable(k, { value: v })}
          options={options}
          selected={value}
          title={k}
        />
      ),
    )}
  </>
);
const AllVariableDropdowns = connect(
  ({ UI }: RootState) => ({
    variables: UI.getIn(['monitoringDashboards', 'variables']).toJS(),
  }),
  { patchVariable: UIActions.monitoringDashboardsPatchVariable },
)(AllVariableDropdowns_);

const timespanOptions = ['5m', '15m', '30m', '1h', '2h', '6h', '12h', '1d', '2d', '1w', '2w'];
const defaultTimespan = '30m';

const pollIntervalOptions = ['5s', '15s', '30s', '1m', '2m', '5m', '15m', '30m'];
const defaultPollInterval = '30s';

// TODO: Dynamically load the list of dashboards
const boards = [
  'etcd',
  'k8s-resources-cluster',
  'k8s-resources-namespace',
  'k8s-resources-workloads-namespace',
  'k8s-resources-node',
  'k8s-resources-pod',
  'k8s-resources-workload',
  'cluster-total',
  'prometheus',
  'node-cluster-rsrc-use',
  'node-rsrc-use',
];

const Card_: React.FC<CardProps> = ({ panel, pollInterval, timespan, variables }) => {
  const rawQueries = _.map(panel.targets, 'expr');
  if (!rawQueries.length) {
    return null;
  }

  const queries = rawQueries.map((expr) => evaluateTemplate(expr, variables));

  // If panel doesn't specify a span, try to get it from the gridPos or default to full width
  let colSpan = panel.span;
  if (!_.isNumber(colSpan)) {
    colSpan = _.has(panel, 'gridPos.w') ? panel.gridPos.w / 2 : 12;
  }

  return (
    <div className={`col-xs-${colSpan}`}>
      <DashboardCard className="monitoring-dashboards__panel">
        <DashboardCardHeader>
          <DashboardCardTitle>{panel.title}</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody>
          {panel.type === 'grafana-piechart-panel' && <BarChart query={queries[0]} />}
          {panel.type === 'graph' && (
            <Graph
              isStack={panel.stack}
              pollInterval={pollInterval}
              queries={queries}
              timespan={timespan}
            />
          )}
          {panel.type === 'row' && !_.isEmpty(panel.panels) && (
            <div className="row">
              {_.map(panel.panels, (p) => (
                <Card key={p.id} panel={p} pollInterval={pollInterval} timespan={timespan} />
              ))}
            </div>
          )}
          {panel.type === 'singlestat' && (
            <SingleStat
              decimals={panel.decimals}
              format={panel.format}
              pollInterval={pollInterval}
              postfix={panel.postfix}
              prefix={panel.prefix}
              query={queries[0]}
              units={panel.units}
            />
          )}
          {panel.type === 'table' && (
            <Table panel={panel} pollInterval={pollInterval} queries={queries} />
          )}
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
};
const Card = connect(({ UI }: RootState) => ({
  variables: UI.getIn(['monitoringDashboards', 'variables']).toJS(),
}))(Card_);

const Board: React.FC<BoardProps> = ({ board, patchVariable, pollInterval, timespan }) => {
  const [data, setData] = React.useState();
  const [error, setError] = React.useState<string>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  const loadVariableValues = React.useCallback(
    (name: string, rawQuery: string) => {
      // Convert label_values queries to something Prometheus can handle
      const query = rawQuery.replace(/label_values\((.*), (.*)\)/, 'count($1) by ($2)');

      const url = getPrometheusURL({ endpoint: PrometheusEndpoint.QUERY, query });
      safeFetch(url).then((response) => {
        const result = _.get(response, 'data.result');
        const options = _.flatMap(result, ({ metric }) => _.values(metric)).sort();
        patchVariable(name, options.length ? { options, value: options[0] } : { value: '' });
      });
    },
    [patchVariable, safeFetch],
  );

  React.useEffect(() => {
    const path = `${k8sBasePath}/api/v1/namespaces/openshift-monitoring/configmaps/grafana-dashboard-${board}`;
    safeFetch(path)
      .then((response) => {
        const json = _.get(response, ['data', `${board}.json`]);
        if (!json) {
          setData(undefined);
          setError('Dashboard definition JSON not found');
        } else {
          const newData = JSON.parse(json);
          setData(newData);
          setError(undefined);

          const newVars = _.get(newData, 'templating.list') as TemplateVariable[];
          const optionsVars = _.filter(newVars, (v) => v.type === 'query' || v.type === 'interval');

          _.each(optionsVars, (v) => {
            if (v.options.length === 1) {
              patchVariable(v.name, { value: v.options[0].value });
            } else if (v.options.length > 1) {
              const options = _.map(v.options, 'value');
              const selected = _.find(v.options, { selected: true });
              const value = (selected || v.options[0]).value;
              patchVariable(v.name, { options, value });
            } else if (!_.isEmpty(v.query)) {
              loadVariableValues(v.name, v.query);
            }
          });
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setData(undefined);
          setError(_.get(err, 'json.error', err.message));
        }
      });
  }, [board, loadVariableValues, patchVariable, safeFetch]);

  if (error) {
    return <ErrorAlert message={error} />;
  }
  if (!data) {
    return <LoadingInline />;
  }

  const rows = _.isEmpty(data.rows) ? [{ panels: data.panels }] : data.rows;

  return (
    <>
      {_.map(rows, (row, i) => (
        <div className="row" key={i}>
          {_.map(row.panels, (panel, j) => (
            <Card key={j} panel={panel} pollInterval={pollInterval} timespan={timespan} />
          ))}
        </div>
      ))}
    </>
  );
};

const MonitoringDashboardsPage_: React.FC<MonitoringDashboardsPageProps> = ({
  clearVariables,
  patchVariable,
}) => {
  const [pollInterval, setPollInterval] = React.useState(
    parsePrometheusDuration(defaultPollInterval),
  );
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration(defaultTimespan));
  const [board, setBoard] = React.useState(boards[0]);

  const onBoardChange = (newBoard: string) => {
    clearVariables();
    setBoard(newBoard);
  };

  return (
    <>
      <Helmet>
        <title>Metrics Dashboards</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading co-m-pane__heading--monitoring-dashboards">
          Metrics Dashboards
          <VariableDropdown onChange={onBoardChange} options={boards} selected={boards[0]} />
        </h1>
        <div className="monitoring-dashboards__options">
          <div className="monitoring-dashboards__options-group">
            <AllVariableDropdowns />
          </div>
          <div className="monitoring-dashboards__options-group">
            <VariableDropdown
              buttonClassName="monitoring-dashboards__dropdown"
              onChange={(v: string) => setTimespan(parsePrometheusDuration(v))}
              options={timespanOptions}
              selected={defaultTimespan}
              title="Time Range"
            />
            <VariableDropdown
              onChange={(v: string) => setPollInterval(parsePrometheusDuration(v))}
              options={pollIntervalOptions}
              selected={defaultPollInterval}
              title="Refresh Interval"
            />
          </div>
        </div>
      </div>
      <Dashboard>
        {board && (
          <Board
            board={board}
            patchVariable={patchVariable}
            pollInterval={pollInterval}
            timespan={timespan}
          />
        )}
      </Dashboard>
    </>
  );
};
const MonitoringDashboardsPage = connect(null, {
  clearVariables: UIActions.monitoringDashboardsClearVariables,
  patchVariable: UIActions.monitoringDashboardsPatchVariable,
})(MonitoringDashboardsPage_);

type TemplateVariable = {
  name: string;
  options: { selected: boolean; value: string }[];
  query: string;
  type: string;
};

type Variable = {
  options?: string[];
  value?: string;
};

type VariablesMap = { [key: string]: Variable };

type VariableDropdownProps = {
  buttonClassName?: string;
  onChange: (v: string) => void;
  options: string[];
  selected: string;
  title?: string;
};

type BoardProps = {
  board: string;
  patchVariable: (key: string, patch: Variable) => undefined;
  pollInterval: number;
  timespan: number;
};

type AllVariableDropdownsProps = {
  patchVariable: (key: string, patch: Variable) => undefined;
  variables: VariablesMap;
};

type CardProps = {
  panel: Panel;
  pollInterval: number;
  timespan: number;
  variables: VariablesMap;
};

type MonitoringDashboardsPageProps = {
  clearVariables: () => undefined;
  patchVariable: (key: string, patch: Variable) => undefined;
};

export default withFallback(MonitoringDashboardsPage, ErrorBoundaryFallback);
