import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

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
import { Dropdown, history, LoadingInline, useSafeFetch } from '../../utils';
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
  buttonClassName = 'monitoring-dashboards__dropdown-button',
  items,
  onChange,
  selectedKey,
  title,
}) => (
  <div className="form-group monitoring-dashboards__dropdown-wrap">
    {title && <label>{title}</label>}
    <Dropdown
      buttonClassName={buttonClassName}
      items={items}
      onChange={onChange}
      selectedKey={selectedKey}
    />
  </div>
);

const AllVariableDropdowns_: React.FC<AllVariableDropdownsProps> = ({
  patchVariable,
  variables,
}) => (
  <>
    {_.map(variables.toJS(), ({ options, value }, k) =>
      _.isEmpty(options) ? null : (
        <VariableDropdown
          items={_.zipObject(options, options)}
          key={k}
          onChange={(v: string) => patchVariable(k, { value: v })}
          selectedKey={value}
          title={k}
        />
      ),
    )}
  </>
);
const AllVariableDropdowns = connect(
  ({ UI }: RootState) => ({
    variables: UI.getIn(['monitoringDashboards', 'variables']),
  }),
  { patchVariable: UIActions.monitoringDashboardsPatchVariable },
)(AllVariableDropdowns_);

const timespanOptions = {
  '5m': '5 mintutes',
  '15m': '15 mintutes',
  '30m': '30 mintutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '6h': '6 hours',
  '12h': '12 hours',
  '1d': '1 day',
  '2d': '2 days',
  '1w': '1 week',
  '2w': '2 weeks',
};
const defaultTimespan = '30m';

const pollOffText = 'Off';
const pollIntervalOptions = {
  [pollOffText]: pollOffText,
  '15s': '15 seconds',
  '30s': '30 seconds',
  '1m': '1 minute',
  '5m': '5 mintutes',
  '15m': '15 mintutes',
  '30m': '30 mintutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
};
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
const boardItems = _.zipObject(boards, boards);

// Matches Prometheus labels surrounded by {{ }} in the graph legend label templates
const legendTemplateOptions = { interpolate: /{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g };

const Card_: React.FC<CardProps> = ({ panel, pollInterval, timespan, variables }) => {
  // If panel doesn't specify a span, default to 12
  const panelSpan: number = _.get(panel, 'span', 12);
  // If panel.span is greater than 12, default colSpan to 12
  const colSpan: number = panelSpan > 12 ? 12 : panelSpan;
  // If colSpan is less than 7, double it for small
  const colSpanSm: number = colSpan < 7 ? colSpan * 2 : colSpan;

  const formatLegendLabel = React.useCallback(
    (labels, i) => {
      const compiled = _.template(panel.targets?.[i]?.legendFormat, legendTemplateOptions);
      return compiled(labels);
    },
    [panel],
  );

  const rawQueries = _.map(panel.targets, 'expr');
  if (!rawQueries.length) {
    return null;
  }
  const queries = rawQueries.map((expr) => evaluateTemplate(expr, variables.toJS()));

  return (
    <div className={`col-xs-12 col-sm-${colSpanSm} col-lg-${colSpan}`}>
      <DashboardCard className="monitoring-dashboards__panel">
        <DashboardCardHeader className="monitoring-dashboards__card-header">
          <DashboardCardTitle>{panel.title}</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody
          className={classNames({
            'co-dashboard-card__body--dashboard-graph': panel.type === 'graph',
          })}
        >
          {panel.type === 'grafana-piechart-panel' && <BarChart query={queries[0]} />}
          {panel.type === 'graph' && (
            <Graph
              formatLegendLabel={panel.legend?.show ? formatLegendLabel : undefined}
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
          {panel.type === 'table' && panel.transform === 'table' && (
            <Table panel={panel} pollInterval={pollInterval} queries={queries} />
          )}
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
};
const Card = connect(({ UI }: RootState) => ({
  variables: UI.getIn(['monitoringDashboards', 'variables']),
}))(Card_);

const Board: React.FC<BoardProps> = ({ board, patchVariable, pollInterval, timespan }) => {
  const [data, setData] = React.useState();
  const [error, setError] = React.useState<string>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  const loadVariableValues = React.useCallback(
    (name: string, rawQuery: string) => {
      // Convert label_values queries to something Prometheus can handle
      // TODO: Once the Prometheus /series endpoint is available through the API proxy, this should
      // be converted to use that instead
      const query = rawQuery.replace(/label_values\((.*), (.*)\)/, 'count($1) by ($2)');
      const url = getPrometheusURL({
        endpoint: PrometheusEndpoint.QUERY_RANGE,
        query,
        samples: 30,
        timeout: '5s',
        timespan,
      });

      safeFetch(url).then((response) => {
        const result = _.get(response, 'data.result');
        const options = _.flatMap(result, ({ metric }) => _.values(metric)).sort();
        patchVariable(name, options.length ? { options, value: options[0] } : { value: '' });
      });
    },
    [patchVariable, safeFetch, timespan],
  );

  React.useEffect(() => {
    if (!board) {
      return;
    }
    setData(undefined);
    setError(undefined);
    const path = `${k8sBasePath}/api/v1/namespaces/openshift-monitoring/configmaps/grafana-dashboard-${board}`;
    safeFetch(path)
      .then((response) => {
        const json = _.get(response, ['data', `${board}.json`]);
        if (!json) {
          setError('Dashboard definition JSON not found');
        } else {
          const newData = JSON.parse(json);
          setData(newData);

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
          setError(_.get(err, 'json.error', err.message));
        }
      });
  }, [board, loadVariableValues, patchVariable, safeFetch]);

  if (!board) {
    return null;
  }
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
        <div className="row monitoring-dashboards__row" key={i}>
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
  deleteAll,
  patchVariable,
  match,
}) => {
  const { board } = match.params;

  // Clear queries on unmount
  React.useEffect(() => deleteAll, [deleteAll]);

  const [pollInterval, setPollInterval] = React.useState(
    parsePrometheusDuration(defaultPollInterval),
  );
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration(defaultTimespan));

  const setBoard = (newBoard: string) => {
    if (newBoard !== board) {
      clearVariables();
      history.replace(`/monitoring/dashboards/${newBoard}`);
    }
  };

  if (!board && boards?.[0]) {
    setBoard(boards[0]);
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Metrics Dashboards</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <div className="monitoring-dashboards__options">
          <VariableDropdown
            items={timespanOptions}
            onChange={(v: string) => setTimespan(parsePrometheusDuration(v))}
            selectedKey={defaultTimespan}
            title="Time Range"
          />
          <VariableDropdown
            items={pollIntervalOptions}
            onChange={(v: string) =>
              setPollInterval(v === pollOffText ? null : parsePrometheusDuration(v))
            }
            selectedKey={defaultPollInterval}
            title="Refresh Interval"
          />
        </div>
        <h1 className="co-m-pane__heading">Dashboards</h1>
        <div className="monitoring-dashboards__variables">
          <VariableDropdown
            items={boardItems}
            onChange={setBoard}
            selectedKey={board}
            title="Dashboard"
          />
          <AllVariableDropdowns />
        </div>
      </div>
      <Dashboard>
        <Board
          board={board}
          patchVariable={patchVariable}
          pollInterval={pollInterval}
          timespan={timespan}
        />
      </Dashboard>
    </>
  );
};
const MonitoringDashboardsPage = connect(null, {
  clearVariables: UIActions.monitoringDashboardsClearVariables,
  deleteAll: UIActions.queryBrowserDeleteAllQueries,
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
  items: { [key: string]: string };
  onChange: (v: string) => void;
  selectedKey: string;
  title?: string;
};

type BoardProps = {
  board: string;
  patchVariable: (key: string, patch: Variable) => undefined;
  pollInterval: null | number;
  timespan: number;
};

type AllVariableDropdownsProps = {
  patchVariable: (key: string, patch: Variable) => undefined;
  variables: ImmutableMap<string, Variable>;
};

type CardProps = {
  panel: Panel;
  pollInterval: null | number;
  timespan: number;
  variables: ImmutableMap<string, Variable>;
};

type MonitoringDashboardsPageProps = {
  clearVariables: () => undefined;
  deleteAll: () => undefined;
  patchVariable: (key: string, patch: Variable) => undefined;
  match: any;
};

export default withFallback(MonitoringDashboardsPage, ErrorBoundaryFallback);
