import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';

import ErrorAlert from '@console/shared/src/components/alerts/error';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';

import { k8sBasePath } from '../../../module/k8s';
import { Dropdown, LoadingInline, useSafeFetch } from '../../utils';
import { parsePrometheusDuration } from '../../utils/datetime';
import { withFallback } from '../../utils/error-boundary';
import BarChart from './bar-chart';
import Graph from './graph';
import SingleStat from './single-stat';
import Table from './table';
import { Panel } from './types';

const evaluateTemplate = (s: string) => {
  // TODO: Variable options will be created based on the dashboard `templating` section
  const variables = {
    cluster: '',
    datasource: 'prometheus',
    interval: '4h',
    namespace: 'openshift-kube-apiserver',
    node: '',
    resolution: '5m',
  };

  return _.reduce(
    variables,
    (result: string, v: string, k: string): string => {
      return result.replace(new RegExp(`\\$${k}`, 'g'), v);
    },
    s,
  );
};

// TODO: Just a stub for now
const VariableDropdowns = () => null;

const timespanOptions = ['5m', '15m', '30m', '1h', '2h', '6h', '12h', '1d', '2d', '1w', '2w'];
const defaultTimespan = '30m';

const pollIntervalOptions = ['5s', '15s', '30s', '1m', '2m', '5m', '15m', '30m'];
const defaultPollInterval = '30s';

// TODO: Dynamically load the list of dashboards
const boards = [
  'k8s-resources-cluster',
  'k8s-resources-namespace',
  'cluster-total',
  'node-cluster-rsrc-use',
];
const DashboardDropdown: React.FC<{ setBoard: (string) => void }> = ({ setBoard }) => {
  const items = _.zipObject(boards, boards);
  return <Dropdown items={items} onChange={(v) => setBoard(v)} selectedKey={boards[0]} />;
};

const DurationDropdown: React.FC<DurationDropdownProps> = ({ items, onChange, selected }) => (
  <Dropdown
    buttonClassName="monitoring-dashboards__dropdown"
    items={_.zipObject(items, items)}
    onChange={(v: string) => onChange(parsePrometheusDuration(v))}
    selectedKey={selected}
  />
);

const Card: React.FC<PanelProps> = ({ panel, pollInterval, timespan }) => {
  const queries = _.map(panel.targets, 'expr').map(evaluateTemplate);
  if (!queries.length) {
    return null;
  }

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
            <Graph pollInterval={pollInterval} queries={queries} timespan={timespan} />
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

const Board: React.FC<{ board: string; pollInterval: number; timespan: number }> = ({
  board,
  pollInterval,
  timespan,
}) => {
  const [data, setData] = React.useState();
  const [error, setError] = React.useState<string>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  React.useEffect(() => {
    const path = `${k8sBasePath}/api/v1/namespaces/openshift-monitoring/configmaps/grafana-dashboard-${board}`;
    safeFetch(path)
      .then((response) => {
        const json = _.get(response, ['data', `${board}.json`]);
        if (!json) {
          setData(undefined);
          setError('Dashboard definition JSON not found');
        } else {
          setData(JSON.parse(json));
          setError(undefined);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setData(undefined);
          setError(_.get(err, 'json.error', err.message));
        }
      });
  }, [board, safeFetch]);

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

const MonitoringDashboardsPage: React.FC<{}> = () => {
  const [pollInterval, setPollInterval] = React.useState(
    parsePrometheusDuration(defaultPollInterval),
  );
  const [timespan, setTimespan] = React.useState(parsePrometheusDuration(defaultTimespan));
  const [board, setBoard] = React.useState(boards[0]);

  return (
    <>
      <Helmet>
        <title>Metrics Dashboards</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading co-m-pane__heading--monitoring-dashboards">
          Metrics Dashboards
          <div className="monitoring-dashboards__dropdown-wrap">
            <DashboardDropdown setBoard={setBoard} />
          </div>
        </h1>
        <div className="monitoring-dashboards__options">
          <div className="monitoring-dashboards__options-group">
            <VariableDropdowns />
          </div>
          <div className="monitoring-dashboards__options-group">
            <div className="monitoring-dashboards__dropdown-wrap">
              <h4>Time Range</h4>
              <DurationDropdown
                items={timespanOptions}
                onChange={setTimespan}
                selected={defaultTimespan}
              />
            </div>
            <div className="monitoring-dashboards__dropdown-wrap">
              <h4>Refresh Interval</h4>
              <DurationDropdown
                items={pollIntervalOptions}
                onChange={setPollInterval}
                selected={defaultPollInterval}
              />
            </div>
          </div>
        </div>
      </div>
      <Dashboard>
        {board && <Board board={board} timespan={timespan} pollInterval={pollInterval} />}
      </Dashboard>
    </>
  );
};

type DurationDropdownProps = {
  items: string[];
  onChange: (string) => void;
  selected: string;
};

type PanelProps = {
  panel: Panel;
  pollInterval: number;
  timespan: number;
};

export default withFallback(MonitoringDashboardsPage);
