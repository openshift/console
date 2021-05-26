import * as _ from 'lodash-es';
import { Button, Dropdown, DropdownToggle, DropdownItem, Label } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { RedExclamationCircleIcon } from '@console/shared';
import ErrorAlert from '@console/shared/src/components/alerts/error';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { withFallback } from '@console/shared/src/components/error/error-boundary';

import {
  monitoringDashboardsPatchAllVariables,
  monitoringDashboardsPatchVariable,
  monitoringDashboardsSetEndTime,
  monitoringDashboardsSetPollInterval,
  monitoringDashboardsSetTimespan,
  monitoringDashboardsVariableOptionsLoaded,
  queryBrowserDeleteAllQueries,
} from '../../../actions/ui';
import { ErrorBoundaryFallback } from '../../error';
import { RootState } from '../../../redux';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { history, LoadingInline, useSafeFetch } from '../../utils';
import { formatPrometheusDuration, parsePrometheusDuration } from '../../utils/datetime';
import IntervalDropdown from '../poll-interval-dropdown';
import BarChart from './bar-chart';
import Graph from './graph';
import SingleStat from './single-stat';
import Table from './table';
import {
  MONITORING_DASHBOARDS_DEFAULT_TIMESPAN,
  MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY,
  Panel,
} from './types';

const NUM_SAMPLES = 30;

const evaluateTemplate = (
  template: string,
  variables: ImmutableMap<string, Variable>,
  timespan: number,
): string => {
  if (_.isEmpty(template)) {
    return undefined;
  }

  // Handle the special `$__interval` and `$__rate_interval` variables
  const intervalMS = timespan / NUM_SAMPLES;
  const intervalMinutes = Math.floor(intervalMS / 1000 / 60);
  // Use a minimum of 5m to make sure we have enough data to perform `irate` calculations, which
  // require 2 data points each. Otherwise, there could be gaps in the graph.
  const interval: Variable = { value: `${Math.max(intervalMinutes, 5)}m` };
  const allVariables = {
    ...variables.toJS(),
    __interval: interval,
    // eslint-disable-next-line camelcase
    __rate_interval: interval,

    // This is last to ensure it is applied after all other variable substitutions (because the
    // other variable substitutions may result in "$__auto_interval_*" being inserted)
    '__auto_interval_[a-z]+': interval,
  };

  let result = template;
  _.each(allVariables, (v, k) => {
    const re = new RegExp(`\\$${k}`, 'g');
    if (result.match(re)) {
      if (v.isLoading) {
        result = undefined;
        return false;
      }
      const replacement =
        v.value === MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY
          ? // Build a regex that tests for all options. After escaping regex characters, we also
            // escape '\' characters so that they are seen as literal '\'s by the PromQL parser.
            `(${v.options.map((s) => _.escapeRegExp(s).replace(/\\/g, '\\\\')).join('|')})`
          : v.value || '';
      result = result.replace(re, replacement);
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
  id,
  isError = false,
  items,
  label,
  onChange,
  selectedKey,
}) => {
  const { t } = useTranslation();

  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);

  return (
    <div className="form-group monitoring-dashboards__dropdown-wrap">
      <label htmlFor={`${id}-dropdown`} className="monitoring-dashboards__dropdown-title">
        {label}
      </label>
      {isError ? (
        <Dropdown
          toggle={
            <DropdownToggle
              className="monitoring-dashboards__dropdown-button"
              id={`${id}-dropdown`}
              isDisabled={true}
            >
              <RedExclamationCircleIcon /> {t('public~Error loading options')}
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
              id={`${id}-dropdown`}
              onToggle={toggleIsOpen}
            >
              {items[selectedKey]}
            </DropdownToggle>
          }
          className="monitoring-dashboards__variable-dropdown"
        />
      )}
    </div>
  );
};

const SingleVariableDropdown: React.FC<SingleVariableDropdownProps> = ({ id, name }) => {
  const timespan = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'timespan']),
  );
  const { includeAll, isHidden, options, query, value } = useSelector(({ UI }: RootState) => {
    const variables = UI.getIn(['monitoringDashboards', 'variables']);
    const variable = variables.toJS()[name];
    return {
      includeAll: variable.includeAll,
      isHidden: variable.isHidden,
      options: variable.options,
      query: evaluateTemplate(variable.query, variables, timespan),
      value: variable.value,
    };
  });

  const dispatch = useDispatch();

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
        timeout: '30s',
        timespan,
      });

      dispatch(monitoringDashboardsPatchVariable(name, { isLoading: true }));

      safeFetch(url)
        .then(({ data }) => {
          setIsError(false);
          const newOptions = _.flatMap(data?.result, ({ metric }) => _.values(metric)).sort();
          dispatch(monitoringDashboardsVariableOptionsLoaded(name, newOptions));
        })
        .catch((err) => {
          dispatch(monitoringDashboardsPatchVariable(name, { isLoading: false }));
          if (err.name !== 'AbortError') {
            setIsError(true);
          }
        });
    }
  }, [dispatch, name, query, safeFetch, timespan]);

  const onChange = React.useCallback(
    (v: string) => dispatch(monitoringDashboardsPatchVariable(name, { value: v })),
    [dispatch, name],
  );

  if (isHidden || (!isError && _.isEmpty(options))) {
    return null;
  }

  const items = includeAll ? { [MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY]: 'All' } : {};
  _.each(options, (option) => {
    items[option] = option;
  });

  return (
    <VariableDropdown
      id={id}
      isError={isError}
      items={items}
      label={name}
      onChange={onChange}
      selectedKey={value}
    />
  );
};

const AllVariableDropdowns = () => {
  const variables = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'variables']),
  );

  return (
    <>
      {variables.keySeq().map((name: string) => (
        <SingleVariableDropdown key={name} id={name} name={name} />
      ))}
    </>
  );
};

const DashboardDropdown = ({ items, onChange, selectedKey }) => {
  const { t } = useTranslation();

  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);

  const tagColors: ('red' | 'purple' | 'blue' | 'green' | 'cyan' | 'orange')[] = [
    'red',
    'purple',
    'blue',
    'green',
    'cyan',
    'orange',
  ];

  const allTags = _.flatMap(items, 'tags');
  const uniqueTags = _.uniq(allTags);

  return (
    <div className="form-group monitoring-dashboards__dropdown-wrap">
      <label className="monitoring-dashboards__dropdown-title" htmlFor="monitoring-board-dropdown">
        {t('public~Dashboard')}
      </label>
      <Dropdown
        className="monitoring-dashboards__variable-dropdown"
        dropdownItems={_.map(items, (item, key) => (
          <DropdownItem
            className="monitoring-dashboards__dashboard_dropdown_item"
            component="button"
            key={key}
            onClick={() => onChange(key)}
          >
            {item.title}
            {item.tags.map((tag, i) => (
              <Label
                className="monitoring-dashboards__dashboard_dropdown_tag"
                color={tagColors[_.indexOf(uniqueTags, tag) % tagColors.length]}
                key={i}
              >
                {tag}
              </Label>
            ))}
          </DropdownItem>
        ))}
        isOpen={isOpen}
        onSelect={setClosed}
        toggle={
          <DropdownToggle
            className="monitoring-dashboards__dropdown-button"
            id="monitoring-board-dropdown"
            onToggle={toggleIsOpen}
          >
            {items[selectedKey]?.title}
          </DropdownToggle>
        }
      />
    </div>
  );
};

export const TimespanDropdown = () => {
  const { t } = useTranslation();

  const timespan = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'timespan']),
  );

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    (v: string) => {
      dispatch(monitoringDashboardsSetTimespan(parsePrometheusDuration(v)));
      dispatch(monitoringDashboardsSetEndTime(null));
    },
    [dispatch],
  );

  const timespanOptions = {
    '5m': t('public~Last {{count}} minute', { count: 5 }),
    '15m': t('public~Last {{count}} minute', { count: 15 }),
    '30m': t('public~Last {{count}} minute', { count: 30 }),
    '1h': t('public~Last {{count}} hour', { count: 1 }),
    '2h': t('public~Last {{count}} hour', { count: 2 }),
    '6h': t('public~Last {{count}} hour', { count: 6 }),
    '12h': t('public~Last {{count}} hour', { count: 12 }),
    '1d': t('public~Last {{count}} day', { count: 1 }),
    '2d': t('public~Last {{count}} day', { count: 2 }),
    '1w': t('public~Last {{count}} week', { count: 1 }),
    '2w': t('public~Last {{count}} week', { count: 2 }),
  };

  return (
    <VariableDropdown
      id="monitoring-time-range-dropdown"
      items={timespanOptions}
      label={t('public~Time range')}
      onChange={onChange}
      selectedKey={formatPrometheusDuration(timespan)}
    />
  );
};

export const PollIntervalDropdown = () => {
  const { t } = useTranslation();

  const interval = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'pollInterval']),
  );

  const dispatch = useDispatch();
  const setInterval = React.useCallback(
    (v: number) => dispatch(monitoringDashboardsSetPollInterval(v)),
    [dispatch],
  );

  return (
    <div className="form-group monitoring-dashboards__dropdown-wrap">
      <label htmlFor="refresh-interval-dropdown" className="monitoring-dashboards__dropdown-title">
        {t('public~Refresh interval')}
      </label>
      <IntervalDropdown
        id="refresh-interval-dropdown"
        interval={interval}
        setInterval={setInterval}
      />
    </div>
  );
};

const QueryBrowserLink = ({ queries }) => {
  const { t } = useTranslation();

  const params = new URLSearchParams();
  queries.forEach((q, i) => params.set(`query${i}`, q));

  return (
    <DashboardCardLink
      aria-label={t('public~Inspect')}
      to={`/monitoring/query-browser?${params.toString()}`}
    >
      {t('public~Inspect')}
    </DashboardCardLink>
  );
};

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

// Matches Prometheus labels surrounded by {{ }} in the graph legend label templates
const legendTemplateOptions = { interpolate: /{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g };

const Card: React.FC<CardProps> = ({ panel }) => {
  const pollInterval = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'pollInterval']),
  );
  const timespan = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'timespan']),
  );
  const variables = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'variables']),
  );

  const formatSeriesTitle = React.useCallback(
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

  if (panel.type === 'row') {
    return (
      <>
        {_.map(panel.panels, (p) => (
          <Card key={p.id} panel={p} />
        ))}
      </>
    );
  }

  if (!['gauge', 'grafana-piechart-panel', 'graph', 'singlestat', 'table'].includes(panel.type)) {
    return null;
  }

  const rawQueries = _.map(panel.targets, 'expr');
  if (!rawQueries.length) {
    return null;
  }
  const queries = rawQueries.map((expr) => evaluateTemplate(expr, variables, timespan));
  const isLoading = _.some(queries, _.isUndefined);

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
          {!isLoading && <QueryBrowserLink queries={queries} />}
        </DashboardCardHeader>
        <DashboardCardBody className="co-dashboard-card__body--dashboard-graph">
          {isLoading ? (
            <LoadingInline />
          ) : (
            <>
              {panel.type === 'grafana-piechart-panel' && (
                <BarChart pollInterval={pollInterval} query={queries[0]} />
              )}
              {panel.type === 'graph' && (
                <Graph
                  formatSeriesTitle={formatSeriesTitle}
                  isStack={panel.stack}
                  pollInterval={pollInterval}
                  queries={queries}
                  showLegend={panel.legend?.show}
                />
              )}
              {(panel.type === 'singlestat' || panel.type === 'gauge') && (
                <SingleStat panel={panel} pollInterval={pollInterval} query={queries[0]} />
              )}
              {panel.type === 'table' && (
                <Table panel={panel} pollInterval={pollInterval} queries={queries} />
              )}
            </>
          )}
        </DashboardCardBody>
      </DashboardCard>
    </div>
  );
};

const PanelsRow: React.FC<{ row: Row }> = ({ row }) => {
  const showButton = row.showTitle && !_.isEmpty(row.title);

  const [isExpanded, toggleIsExpanded] = useBoolean(showButton ? !row.collapse : true);

  const Icon = isExpanded ? AngleDownIcon : AngleRightIcon;
  const title = isExpanded ? 'Hide' : 'Show';

  return (
    <div>
      {showButton && (
        <Button
          aria-label={title}
          className="pf-m-link--align-left"
          onClick={toggleIsExpanded}
          style={{ fontSize: 24 }}
          title={title}
          variant="plain"
        >
          <Icon />
          &nbsp;{row.title}
        </Button>
      )}
      {isExpanded && (
        <div className="monitoring-dashboards__row">
          {_.map(row.panels, (panel) => (
            <Card key={panel.id} panel={panel} />
          ))}
        </div>
      )}
    </div>
  );
};

const Board: React.FC<BoardProps> = ({ rows }) => (
  <>
    {_.map(rows, (row) => (
      <PanelsRow key={_.map(row.panels, 'id').join()} row={row} />
    ))}
  </>
);

const MonitoringDashboardsPage: React.FC<MonitoringDashboardsPageProps> = ({ match }) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const [board, setBoard] = React.useState<string>();
  const [boards, setBoards] = React.useState<Board[]>([]);
  const [error, setError] = React.useState<string>();
  const [isLoading, , , setLoaded] = useBoolean(true);

  const safeFetch = React.useCallback(useSafeFetch(), []);

  // Clear queries on unmount
  React.useEffect(() => () => dispatch(queryBrowserDeleteAllQueries()), [dispatch]);

  React.useEffect(() => {
    safeFetch('/api/console/monitoring-dashboard-config')
      .then((response) => {
        setLoaded();
        setError(undefined);

        const getBoardData = (item): Board => {
          try {
            return {
              data: JSON.parse(_.values(item.data)[0]),
              name: item.metadata.name,
            };
          } catch (e) {
            setError(
              t('public~Could not parse JSON data for dashboard "{{dashboard}}"', {
                dashboard: item.metadata.name,
              }),
            );
          }
        };

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
  }, [safeFetch, setLoaded, t]);

  const boardItems = React.useMemo(
    () =>
      _.mapValues(_.mapKeys(boards, 'name'), (b) => ({
        tags: b.data.tags,
        title: b.data.title,
      })),
    [boards],
  );

  const changeBoard = React.useCallback(
    (newBoard: string) => {
      if (newBoard !== board) {
        const data = _.find(boards, { name: newBoard })?.data;

        const allVariables = {};
        _.each(data?.templating?.list, (v) => {
          if (v.type === 'query' || v.type === 'interval') {
            // Look for an option that should be selected by default
            let value = _.find(v.options, { selected: true })?.value;

            // If no default option was found, see if the "All" option should be the default
            if (
              value === undefined &&
              v.includeAll &&
              v.current.selected === true &&
              v.current.value === '$__all'
            ) {
              value = MONITORING_DASHBOARDS_VARIABLE_ALL_OPTION_KEY;
            }

            allVariables[v.name] = ImmutableMap({
              includeAll: !!v.includeAll,
              isHidden: v.hide !== 0,
              isLoading: v.type === 'query',
              options: _.map(v.options, 'value'),
              query: v.type === 'query' ? v.query : undefined,
              value: value || v.options?.[0]?.value,
            });
          }
        });
        dispatch(monitoringDashboardsPatchAllVariables(allVariables));

        // Set time range options to their defaults since they may have been changed on the
        // previous dashboard
        dispatch(monitoringDashboardsSetEndTime(null));
        dispatch(monitoringDashboardsSetTimespan(MONITORING_DASHBOARDS_DEFAULT_TIMESPAN));

        setBoard(newBoard);
        history.replace(`/monitoring/dashboards/${newBoard}`);
      }
    },
    [board, boards, dispatch],
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

  // If we don't find any rows, build the rows array based on what we have in `data.panels`
  const rows = data?.rows?.length
    ? data.rows
    : data?.panels?.reduce((acc, panel) => {
        if (panel.type === 'row' || acc.length === 0) {
          acc.push(_.cloneDeep(panel));
        } else {
          const row = acc[acc.length - 1];
          if (_.isNil(row.panels)) {
            row.panels = [];
          }
          row.panels.push(panel);
        }
        return acc;
      }, []);

  return (
    <>
      <Helmet>
        <title>{t('public~Metrics dashboards')}</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <div className="monitoring-dashboards__header">
          <h1 className="co-m-pane__heading">
            <span>{t('public~Dashboards')}</span>
          </h1>
          <div className="monitoring-dashboards__options">
            <TimespanDropdown />
            <PollIntervalDropdown />
          </div>
        </div>
        <div className="monitoring-dashboards__variables">
          {!_.isEmpty(boardItems) && (
            <DashboardDropdown items={boardItems} onChange={changeBoard} selectedKey={board} />
          )}
          <AllVariableDropdowns key={board} />
        </div>
      </div>
      <Dashboard>{isLoading ? <LoadingInline /> : <Board key={board} rows={rows} />}</Dashboard>
    </>
  );
};

type TemplateVariable = {
  current: {
    selected?: boolean;
    value?: string;
  };
  hide: number;
  includeAll: boolean;
  name: string;
  options: { selected: boolean; value: string }[];
  query: string;
  type: string;
};

type Row = {
  collapse?: boolean;
  panels: Panel[];
  showTitle?: boolean;
  title?: string;
};

type Board = {
  data: {
    panels: Panel[];
    rows: Row[];
    templating: {
      list: TemplateVariable[];
    };
    tags: string;
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

type VariableDropdownProps = {
  id: string;
  isError?: boolean;
  items: { [key: string]: string };
  label: string;
  onChange: (v: string) => void;
  selectedKey: string;
};

type SingleVariableDropdownProps = {
  id: string;
  name: string;
};

type BoardProps = {
  rows: Row[];
};

type CardProps = {
  panel: Panel;
};

type MonitoringDashboardsPageProps = {
  match: {
    params: { board: string };
  };
};

export default withFallback(MonitoringDashboardsPage, ErrorBoundaryFallback);
