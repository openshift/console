import * as _ from 'lodash-es';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { RedExclamationCircleIcon } from '@console/shared';
import ErrorAlert from '@console/shared/src/components/alerts/error';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { withFallback } from '@console/shared/src/components/error/error-boundary';

import * as UIActions from '../../../actions/ui';
import { ErrorBoundaryFallback } from '../../error';
import { RootState } from '../../../redux-types';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { ExternalLink, history, LoadingInline, useSafeFetch } from '../../utils';
import { formatPrometheusDuration, parsePrometheusDuration } from '../../utils/datetime';
import BarChart from './bar-chart';
import Graph from './graph';
import SingleStat from './single-stat';
import Table from './table';
import { Panel } from './types';

const NUM_SAMPLES = 30;

const evaluateTemplate = (s: string, variables: VariablesMap, timespan: number): string => {
  if (_.isEmpty(s)) {
    return undefined;
  }
  let result = s;
  // Handle the special `$__interval` variable.
  // https://grafana.com/docs/grafana/latest/reference/templating/#the-interval-variable
  const intervalMS = timespan / NUM_SAMPLES;
  const intervalMinutes = Math.floor(intervalMS / 1000 / 60);
  // Use a minimum of 5m to make sure we have enough data to perform `irate`
  // calculations, which require 2 data points each. Otherwise, there could be
  // gaps in the graph.
  const __interval: Variable = { value: `${Math.max(intervalMinutes, 5)}m` };
  _.each({ ...variables, __interval }, (v, k) => {
    const re = new RegExp(`\\$${k}`, 'g');
    if (result.match(re)) {
      if (v.isLoading) {
        result = undefined;
        return false;
      }
      result = result.replace(re, v.value || '');
    }
  });
  return result;
};

const useBoolean = (initialValue: boolean): [boolean, () => void, () => void, () => void] => {
  const [value, setValue] = React.useState(initialValue);
  const toggle = React.useCallback(() => setValue((v) => !v), []);
  const setTrue = React.useCallback(() => setValue(true), []);
  const setFalse = React.useCallback(() => setValue(false), []);
  return [value, toggle, setTrue, setFalse];
};

const VariableDropdown: React.FC<VariableDropdownProps> = ({
  isError = false,
  items,
  label,
  onChange,
  selectedKey,
}) => {
  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);

  return (
    <div className="form-group monitoring-dashboards__dropdown-wrap">
      <label className="monitoring-dashboards__dropdown-title">{label}</label>
      {isError ? (
        <Dropdown
          toggle={
            <DropdownToggle className="monitoring-dashboards__dropdown-button" isDisabled={true}>
              <RedExclamationCircleIcon /> Error loading options
            </DropdownToggle>
          }
        />
      ) : (
        <Dropdown
          dropdownItems={_.map(items, (name, key) => (
            <DropdownItem component="button" key={key} onClick={() => onChange(key)}>
              {name}
            </DropdownItem>
          ))}
          isOpen={isOpen}
          onSelect={setClosed}
          toggle={
            <DropdownToggle
              className="monitoring-dashboards__dropdown-button"
              onToggle={toggleIsOpen}
            >
              {items[selectedKey]}
            </DropdownToggle>
          }
        />
      )}
    </div>
  );
};

const SingleVariableDropdown_: React.FC<SingleVariableDropdownProps> = ({
  isHidden,
  name,
  options,
  optionsLoaded,
  patchVariable,
  query,
  timespan,
  value,
}) => {
  const safeFetch = React.useCallback(useSafeFetch(), []);

  const [isError, setIsError] = React.useState(false);

  React.useEffect(() => {
    if (query) {
      // Convert label_values queries to something Prometheus can handle
      // TODO: Once the Prometheus /series endpoint is available through the API proxy, this should
      // be converted to use that instead
      const prometheusQuery = query.replace(/label_values\((.*), (.*)\)/, 'count($1) by ($2)');

      const url = getPrometheusURL({
        endpoint: PrometheusEndpoint.QUERY_RANGE,
        query: prometheusQuery,
        samples: NUM_SAMPLES,
        timeout: '5s',
        timespan,
      });

      patchVariable(name, { isLoading: true });

      safeFetch(url)
        .then(({ data }) => {
          setIsError(false);
          const newOptions = _.flatMap(data?.result, ({ metric }) => _.values(metric)).sort();
          optionsLoaded(name, newOptions);
        })
        .catch((err) => {
          patchVariable(name, { isLoading: false });
          if (err.name !== 'AbortError') {
            setIsError(true);
          }
        });
    }
  }, [name, patchVariable, query, safeFetch, optionsLoaded, timespan]);

  const onChange = React.useCallback((v: string) => patchVariable(name, { value: v }), [
    name,
    patchVariable,
  ]);

  if (isHidden || (!isError && _.isEmpty(options))) {
    return null;
  }

  return (
    <VariableDropdown
      isError={isError}
      items={_.zipObject(options, options)}
      label={name}
      onChange={onChange}
      selectedKey={value}
    />
  );
};
const SingleVariableDropdown = connect(
  ({ UI }: RootState, { name }: { name: string }) => {
    const variables = UI.getIn(['monitoringDashboards', 'variables']).toJS();
    const timespan = UI.getIn(['monitoringDashboards', 'timespan']);
    const { isHidden, options, query, value } = variables[name] ?? {};
    return {
      isHidden,
      options,
      query: evaluateTemplate(query, variables, timespan),
      timespan,
      value,
    };
  },
  {
    optionsLoaded: UIActions.monitoringDashboardsVariableOptionsLoaded,
    patchVariable: UIActions.monitoringDashboardsPatchVariable,
  },
)(SingleVariableDropdown_);

const AllVariableDropdowns_: React.FC<AllVariableDropdownsProps> = ({ variables }) => (
  <>
    {variables.keySeq().map((name) => (
      <SingleVariableDropdown key={name} name={name} />
    ))}
  </>
);
const AllVariableDropdowns = connect(({ UI }: RootState) => ({
  variables: UI.getIn(['monitoringDashboards', 'variables']),
}))(AllVariableDropdowns_);

const timespanOptions = {
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '6h': '6 hours',
  '12h': '12 hours',
  '1d': '1 day',
  '2d': '2 days',
  '1w': '1 week',
  '2w': '2 weeks',
};

const TimespanDropdown_: React.FC<TimespanDropdownProps> = ({ timespan, setTimespan }) => {
  const onChange = React.useCallback((v: string) => setTimespan(parsePrometheusDuration(v)), [
    setTimespan,
  ]);

  return (
    <VariableDropdown
      items={timespanOptions}
      label="Time Range"
      onChange={onChange}
      selectedKey={formatPrometheusDuration(timespan)}
    />
  );
};

export const TimespanDropdown = connect(
  ({ UI }: RootState) => ({
    timespan: UI.getIn(['monitoringDashboards', 'timespan']),
  }),
  {
    setTimespan: UIActions.monitoringDashboardsSetTimespan,
  },
)(TimespanDropdown_);

const pollOffText = 'Off';
const pollIntervalOptions = {
  [pollOffText]: pollOffText,
  '15s': '15 seconds',
  '30s': '30 seconds',
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
};

const PollIntervalDropdown_: React.FC<PollIntervalDropdownProps> = ({
  pollInterval,
  setPollInterval,
}) => {
  const onChange = React.useCallback(
    (v: string) => setPollInterval(v === pollOffText ? null : parsePrometheusDuration(v)),
    [setPollInterval],
  );

  return (
    <VariableDropdown
      items={pollIntervalOptions}
      label="Refresh Interval"
      onChange={onChange}
      selectedKey={pollInterval === null ? pollOffText : formatPrometheusDuration(pollInterval)}
    />
  );
};

export const PollIntervalDropdown = connect(
  ({ UI }: RootState) => ({
    pollInterval: UI.getIn(['monitoringDashboards', 'pollInterval']),
  }),
  {
    setPollInterval: UIActions.monitoringDashboardsSetPollInterval,
  },
)(PollIntervalDropdown_);

// Matches Prometheus labels surrounded by {{ }} in the graph legend label templates
const legendTemplateOptions = { interpolate: /{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g };

const CardBody_: React.FC<CardBodyProps> = ({ panel, pollInterval, timespan, variables }) => {
  const formatLegendLabel = React.useCallback(
    (labels, i) => {
      const legendFormat = panel.targets?.[i]?.legendFormat;
      const compiled = _.template(legendFormat, legendTemplateOptions);
      try {
        return compiled(labels);
      } catch (e) {
        // If we can't format the label (e.g. if one of it's variables is missing from `labels`),
        // show the template string instead
        return legendFormat;
      }
    },
    [panel],
  );

  const variablesJS: VariablesMap = variables.toJS();

  const rawQueries = _.map(panel.targets, 'expr');
  if (!rawQueries.length) {
    return null;
  }
  const queries = rawQueries.map((expr) => evaluateTemplate(expr, variablesJS, timespan));

  if (_.some(queries, _.isUndefined)) {
    return <LoadingInline />;
  }

  return (
    <>
      {panel.type === 'grafana-piechart-panel' && (
        <BarChart pollInterval={pollInterval} query={queries[0]} />
      )}
      {panel.type === 'graph' && (
        <Graph
          formatLegendLabel={panel.legend?.show ? formatLegendLabel : undefined}
          isStack={panel.stack}
          pollInterval={pollInterval}
          queries={queries}
        />
      )}
      {panel.type === 'singlestat' && (
        <SingleStat panel={panel} pollInterval={pollInterval} query={queries[0]} />
      )}
      {panel.type === 'table' && (
        <Table panel={panel} pollInterval={pollInterval} queries={queries} />
      )}
    </>
  );
};
const CardBody = connect(({ UI }: RootState) => ({
  pollInterval: UI.getIn(['monitoringDashboards', 'pollInterval']),
  timespan: UI.getIn(['monitoringDashboards', 'timespan']),
  variables: UI.getIn(['monitoringDashboards', 'variables']),
}))(CardBody_);

// Determine how many columns a panel should span. If panel specifies a `span`, use that. Otherwise
// look for a `breakpoint` percentage. If neither are specified, default to 12 (full width).
const getPanelSpan = (panel: Panel): number => {
  if (panel.span) {
    return panel.span;
  }
  const breakpoint = _.toInteger(_.trimEnd(panel.breakpoint, '%'));
  if (breakpoint > 0) {
    return Math.round(12 * (breakpoint / 100));
  }
  return 12;
};

const getPanelClassModifier = (panel: Panel): string => {
  const span: number = getPanelSpan(panel);
  switch (span) {
    case 6:
      return 'max-2';
    case 2:
    // fallthrough
    case 4:
    // fallthrough
    case 5:
      return 'max-3';
    case 3:
      return 'max-4';
    default:
      return 'max-1';
  }
};

const Card: React.FC<CardProps> = ({ panel }) => {
  if (panel.type === 'row') {
    return (
      <>
        {_.map(panel.panels, (p) => (
          <Card key={p.id} panel={p} />
        ))}
      </>
    );
  }

  const panelClassModifier = getPanelClassModifier(panel);
  return (
    <div
      className={`monitoring-dashboards__panel monitoring-dashboards__panel--${panelClassModifier}`}
    >
      <DashboardCard
        className="monitoring-dashboards__card"
        gradient={panel.type === 'grafana-piechart-panel'}
      >
        <DashboardCardHeader className="monitoring-dashboards__card-header">
          <DashboardCardTitle>{panel.title}</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody className="co-dashboard-card__body--dashboard-graph">
          <CardBody panel={panel} />
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
};

const Board: React.FC<BoardProps> = ({ rows }) => (
  <>
    {_.map(rows, (row, i) => (
      <div className="monitoring-dashboards__row" key={i}>
        {_.map(row.panels, (panel) => (
          <Card key={panel.id} panel={panel} />
        ))}
      </div>
    ))}
  </>
);

const GrafanaLink = () =>
  _.isEmpty(window.SERVER_FLAGS.grafanaPublicURL) ? null : (
    <span className="monitoring-header-link">
      <ExternalLink href={window.SERVER_FLAGS.grafanaPublicURL} text="Grafana UI" />
    </span>
  );

const MonitoringDashboardsPage_: React.FC<MonitoringDashboardsPageProps> = ({
  deleteAll,
  match,
  patchAllVariables,
}) => {
  const [board, setBoard] = React.useState<string>();
  const [boards, setBoards] = React.useState<Board[]>([]);
  const [error, setError] = React.useState<string>();
  const [isLoading, , , setLoaded] = useBoolean(true);

  const safeFetch = React.useCallback(useSafeFetch(), []);

  // Clear queries on unmount
  React.useEffect(() => deleteAll, [deleteAll]);

  React.useEffect(() => {
    safeFetch('/api/console/monitoring-dashboard-config')
      .then((response) => {
        setLoaded();
        setError(undefined);

        const getBoardData = (item): Board => ({
          data: JSON.parse(_.values(item?.data)[0]),
          name: item.metadata.name,
        });
        const newBoards = _.sortBy(_.map(response.items, getBoardData), (v) =>
          _.toLower(v?.data?.title),
        );
        setBoards(newBoards);
      })
      .catch((err) => {
        setLoaded();
        if (err.name !== 'AbortError') {
          setError(_.get(err, 'json.error', err.message));
        }
      });
  }, [safeFetch, setLoaded]);

  const boardItems = React.useMemo(() => _.mapValues(_.mapKeys(boards, 'name'), 'data.title'), [
    boards,
  ]);

  const changeBoard = React.useCallback(
    (newBoard: string) => {
      if (newBoard !== board) {
        const data = _.find(boards, { name: newBoard })?.data;

        const allVariables = {};
        _.each(data?.templating?.list, (v) => {
          if (v.type === 'query' || v.type === 'interval') {
            allVariables[v.name] = ImmutableMap({
              isHidden: v.hide !== 0,
              isLoading: v.type === 'query',
              options: _.map(v.options, 'value'),
              query: v.type === 'query' ? v.query : undefined,
              value: _.find(v.options, { selected: true })?.value || v.options?.[0]?.value,
            });
          }
        });
        patchAllVariables(allVariables);

        setBoard(newBoard);
        history.replace(`/monitoring/dashboards/${newBoard}`);
      }
    },
    [board, boards, patchAllVariables],
  );

  // Default to displaying the first board
  React.useEffect(() => {
    if (!board && !_.isEmpty(boards)) {
      changeBoard(match.params.board || boards?.[0]?.name);
    }
  }, [board, boards, changeBoard, match.params.board]);

  if (error) {
    return <ErrorAlert message={error} />;
  }

  const data = _.find(boards, { name: board })?.data;
  const rows = _.isEmpty(data?.rows) ? [{ panels: data?.panels }] : data?.rows;

  return (
    <>
      <Helmet>
        <title>Metrics Dashboards</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <div className="monitoring-dashboards__header">
          <h1 className="co-m-pane__heading">
            <span>
              Dashboards <GrafanaLink />
            </span>
          </h1>
          <div className="monitoring-dashboards__options">
            <TimespanDropdown />
            <PollIntervalDropdown />
          </div>
        </div>
        <div className="monitoring-dashboards__variables">
          {!_.isEmpty(boardItems) && (
            <VariableDropdown
              items={boardItems}
              label="Dashboard"
              onChange={changeBoard}
              selectedKey={board}
            />
          )}
          <AllVariableDropdowns key={board} />
        </div>
      </div>
      <Dashboard>{isLoading ? <LoadingInline /> : <Board key={board} rows={rows} />}</Dashboard>
    </>
  );
};
const MonitoringDashboardsPage = connect(null, {
  deleteAll: UIActions.queryBrowserDeleteAllQueries,
  patchAllVariables: UIActions.monitoringDashboardsPatchAllVariables,
})(MonitoringDashboardsPage_);

type TemplateVariable = {
  hide: number;
  name: string;
  options: { selected: boolean; value: string }[];
  query: string;
  type: string;
};

type Row = {
  panels: Panel[];
};

type Board = {
  data: {
    panels: Panel[];
    rows: Row[];
    templating: {
      list: TemplateVariable[];
    };
    title: string;
  };
  name: string;
};

type Variable = {
  isHidden?: boolean;
  isLoading?: boolean;
  options?: string[];
  query?: string;
  value?: string;
};

type VariablesMap = { [key: string]: Variable };

type VariableDropdownProps = {
  isError?: boolean;
  items: { [key: string]: string };
  label: string;
  onChange: (v: string) => void;
  selectedKey: string;
};

type SingleVariableDropdownProps = {
  isHidden: boolean;
  name: string;
  options?: string[];
  patchVariable: (key: string, patch: Variable) => undefined;
  query?: string;
  optionsLoaded: (key: string, newOptions: string[]) => undefined;
  timespan: number;
  value?: string;
};

type BoardProps = {
  rows: Row[];
};

type AllVariableDropdownsProps = {
  variables: ImmutableMap<string, ImmutableMap<string, any>>;
};

type TimespanDropdownProps = {
  timespan: number;
  setTimespan: (v: number) => never;
};

type PollIntervalDropdownProps = {
  pollInterval: number;
  setPollInterval: (v: number) => never;
};

type CardBodyProps = {
  panel: Panel;
  pollInterval: null | number;
  timespan: number;
  variables: ImmutableMap<string, ImmutableMap<string, any>>;
};

type CardProps = {
  panel: Panel;
};

type MonitoringDashboardsPageProps = {
  deleteAll: () => undefined;
  match: {
    params: { board: string };
  };
  patchAllVariables: (variables: VariablesMap) => undefined;
};

export default withFallback(MonitoringDashboardsPage, ErrorBoundaryFallback);
