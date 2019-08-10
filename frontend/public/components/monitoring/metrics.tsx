import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import {
  ActionGroup,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Switch,
  Title,
} from '@patternfly/react-core';
import {
  AngleDownIcon,
  AngleRightIcon,
  ChartLineIcon,
  CompressIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import {
  IDecorator,
  ISortBy,
  sortable,
  Table,
  TableBody,
  TableGridBreakpoint,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';

import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';
import * as UIActions from '../../actions/ui';
import { connectToURLs, MonitoringRoutes } from '../../reducers/monitoring';
import { fuzzyCaseInsensitive } from '../factory/table-filters';
import { PROMETHEUS_BASE_PATH } from '../graphs';
import { getPrometheusURL, PrometheusEndpoint } from '../graphs/helpers';
import { getPrometheusExpressionBrowserURL } from '../graphs/prometheus-graph';
import {
  ActionsMenu,
  Dropdown,
  ExternalLink,
  getURLSearchParams,
  Kebab,
  LoadingInline,
  usePoll,
  useSafeFetch,
} from '../utils';
import { withFallback } from '../utils/error-boundary';
import { setAllQueryArguments } from '../utils/router';
import { chartTheme, Labels, PrometheusSeries, QueryBrowser } from './query-browser';

const aggregationOperators = [
  'avg',
  'bottomk',
  'count',
  'count_values',
  'max',
  'min',
  'quantile',
  'stddev',
  'stdvar',
  'sum',
  'topk',
];

const prometheusFunctions = [
  'abs()',
  'absent()',
  'avg_over_time()',
  'ceil()',
  'changes()',
  'clamp_max()',
  'clamp_min()',
  'count_over_time()',
  'day_of_month()',
  'day_of_week()',
  'days_in_month()',
  'delta()',
  'deriv()',
  'exp()',
  'floor()',
  'histogram_quantile()',
  'holt_winters()',
  'hour()',
  'idelta()',
  'increase()',
  'irate()',
  'label_join()',
  'label_replace()',
  'ln()',
  'log10()',
  'log2()',
  'max_over_time()',
  'min_over_time()',
  'minute()',
  'month()',
  'predict_linear()',
  'quantile_over_time()',
  'rate()',
  'resets()',
  'round()',
  'scalar()',
  'sort()',
  'sort_desc()',
  'sqrt()',
  'stddev_over_time()',
  'stdvar_over_time()',
  'sum_over_time()',
  'time()',
  'timestamp()',
  'vector()',
  'year()',
];

const HeaderPrometheusLink_ = ({queries, urls}) => {
  const url = getPrometheusExpressionBrowserURL(urls, queries);
  return _.isEmpty(url)
    ? null
    : <span className="monitoring-header-link">
      <ExternalLink href={url} text="Prometheus UI" />
    </span>;
};
const HeaderPrometheusLink = connectToURLs(MonitoringRoutes.Prometheus)(HeaderPrometheusLink_);

export const graphStateToProps = ({UI}) => ({hideGraphs: !!UI.getIn(['monitoring', 'hideGraphs'])});

const ToggleGraph_ = ({hideGraphs, toggle}) => {
  const icon = hideGraphs ? <ChartLineIcon /> : <CompressIcon />;

  return <button type="button" className="btn btn-link query-browser__toggle-graph" onClick={toggle}>
    {hideGraphs ? 'Show' : 'Hide'} Graph {icon}
  </button>;
};
export const ToggleGraph = connect(graphStateToProps, {toggle: UIActions.monitoringToggleGraphs})(ToggleGraph_);

const MetricsDropdown = ({onChange, onLoad}) => {
  const [items, setItems] = React.useState({});
  const [isError, setIsError] = React.useState(false);

  const safeFetch = React.useCallback(useSafeFetch(), []);

  React.useEffect(() => {
    safeFetch(`${PROMETHEUS_BASE_PATH}/${PrometheusEndpoint.LABEL}/__name__/values`)
      .then(({data}) => {
        setItems(_.zipObject(data, data));
        if (onLoad) {
          onLoad(data);
        }
      })
      .catch(() => setIsError(true));
  }, [onLoad, safeFetch]);

  let title: React.ReactNode = 'Insert Metric at Cursor';
  if (isError) {
    title = <span><RedExclamationCircleIcon /> Failed to load metrics list.</span>;
  } else if (_.isEmpty(items)) {
    title = <LoadingInline />;
  }

  return <Dropdown
    autocompleteFilter={fuzzyCaseInsensitive}
    disabled={isError}
    id="metrics-dropdown"
    items={items}
    menuClassName="query-browser__metrics-dropdown-menu query-browser__metrics-dropdown-menu--insert"
    onChange={onChange}
    title={title}
  />;
};

const ExpandButton = ({isExpanded, onClick}) => {
  const title = `${isExpanded ? 'Hide' : 'Show'} Table`;
  return <button aria-label={title} className="btn btn-link query-browser__expand-button" onClick={onClick} title={title}>
    {isExpanded ? <AngleDownIcon className="query-browser__expand-icon" /> : <AngleRightIcon className="query-browser__expand-icon" />}
  </button>;
};

const SeriesButton = ({colorIndex, isDisabled, onClick}) => {
  const title = `${isDisabled ? 'Show' : 'Hide'} series`;
  const colors = chartTheme.line.colorScale;

  return <div className="query-browser__series-btn-wrap">
    <button
      aria-label={title}
      className={classNames('query-browser__series-btn', {'query-browser__series-btn--disabled': isDisabled})}
      onClick={onClick}
      style={isDisabled ? undefined : {backgroundColor: colors[colorIndex % colors.length]}}
      title={title}
      type="button"
    ></button>
  </div>;
};

const QueryInput: React.FC<QueryInputProps> = ({metrics = [], onBlur, onSubmit, onUpdate, value = ''}) => {
  const [token, setToken] = React.useState('');

  const inputRef = React.useRef(null);

  const getTextBeforeCursor = () => inputRef.current.value.substring(0, inputRef.current.selectionEnd);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(e.target.value);

    // Metric and function names can only contain the characters a-z, A-Z, 0-9, '_' and ':'
    const allTokens = getTextBeforeCursor().split(/[^a-zA-Z0-9_:]+/);

    // We always do case insensitive autocompletion, so convert to lower case immediately
    setToken(_.toLower(_.last(allTokens)));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter+Shift inserts newlines, Enter alone runs the query
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
      setToken('');
    }
  };

  const onTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!_.get(e, 'relatedTarget.dataset.autocomplete')) {
      onBlur(e);
      setToken('');
    }
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Replace the autocomplete token with the selected autocomplete option
    const re = new RegExp(`${_.escapeRegExp(token)}$`);
    const newTextBeforeCursor = getTextBeforeCursor().replace(re, e.currentTarget.dataset.autocomplete);
    onUpdate(newTextBeforeCursor + value.substring(inputRef.current.selectionEnd));

    setToken('');
    inputRef.current.focus();

    // Move cursor to just after the text we inserted (use _.defer() so this is called after the textarea value is set)
    const cursorPosition = newTextBeforeCursor.length;
    _.defer(() => inputRef.current.setSelectionRange(cursorPosition, cursorPosition));
  };

  const onClear = () => {
    onUpdate('');
    inputRef.current.focus();
  };

  // Order autocompletion suggestions so that exact matches (token as a substring) are first, then fuzzy matches after
  // Exact matches are sorted first by how early the token appears and secondarily by string length (shortest first)
  // Fuzzy matches are sorted by string length (shortest first)
  const isMatch = v => fuzzyCaseInsensitive(token, v);
  const matchScore = (v: string): number => {
    const i = v.toLowerCase().indexOf(token);
    return i === -1 ? Infinity : i;
  };
  const filterSuggestions = (options: string[]): string[] => _.sortBy(options.filter(isMatch), [matchScore, 'length']);

  const allSuggestions = token.length < 2
    ? {}
    : _.omitBy({
      ['Aggregation Operators']: filterSuggestions(aggregationOperators),
      ['Functions']: filterSuggestions(prometheusFunctions),
      ['Metrics']: filterSuggestions(metrics),
    }, _.isEmpty);

  // Set the default textarea height to the number of lines in the query text
  const rows = Math.min((value.match(/\n/g) || []).length + 1, 10);

  return <div className="query-browser__query pf-c-dropdown">
    <textarea
      autoFocus
      className="pf-c-form-control query-browser__query-input"
      onBlur={onTextareaBlur}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder="Expression (press Shift+Enter for newlines)"
      ref={inputRef}
      rows={rows}
      spellCheck={false}
      value={value}
    />
    <button className="btn btn-link query-browser__clear-icon" aria-label="Clear Query" onClick={onClear} type="button">
      <TimesIcon />
    </button>
    {!_.isEmpty(allSuggestions) && <ul className="pf-c-dropdown__menu query-browser__metrics-dropdown-menu">
      {_.map(allSuggestions, (suggestions, title) => <React.Fragment key={title}>
        <div className="text-muted query-browser__dropdown--subtitle">{title}</div>
        {_.map(suggestions, s => <li key={s}>
          <button className="pf-c-dropdown__menu-item" data-autocomplete={s} onClick={onClick} type="button">{s}</button>
        </li>)}
      </React.Fragment>)}
    </ul>}
  </div>;
};

const QueryTable: React.FC<QueryTableProps> = ({allSeries, colorOffset, disabledSeries, query, toggleSeries}) => {
  const [data, setData] = React.useState({});
  const [isError, setIsError] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<ISortBy>({index: 0, direction: 'asc'});

  const safeFetch = React.useCallback(useSafeFetch(), [query]);

  const tick = () => safeFetch(getPrometheusURL({endpoint: PrometheusEndpoint.QUERY, query}))
    .then(response => {
      setData(_.get(response, 'data.result'));
      setIsError(false);
    })
    .catch(() => setIsError(true));

  usePoll(tick, 15 * 1000, query);

  if (allSeries && allSeries.length === 0) {
    return <div className="query-browser__no-data-warning">
      <YellowExclamationTriangleIcon /> No datapoints found.
    </div>;
  }

  const cellProps = {
    props: {className: 'query-browser__table-cell'},
    transforms: [sortable as (v: any) => IDecorator],
  };

  const allLabelKeys = _.uniq(_.flatMap(allSeries, s => _.keys(s))).sort();
  const columns = [
    '',
    ...allLabelKeys.map(k => ({title: k === '__name__' ? 'Name' : k, ...cellProps})),
    {title: 'Value', ...cellProps},
  ];

  const getValue = labels => {
    if (isError) {
      return <div><span className="text-muted"><RedExclamationCircleIcon /> Error loading value</span></div>;
    }
    const series = _.find(data, ({metric}) => _.isEqual(metric, labels));
    return _.get(series, 'value[1]', <div><span className="text-muted">None</span></div>);
  };

  const unsortedRows = _.map(allSeries, (labels, i) => [
    <div key="series-button">
      <SeriesButton
        colorIndex={colorOffset + i}
        isDisabled={_.some(disabledSeries, s => _.isEqual(s, labels))}
        onClick={() => toggleSeries(labels)}
      />
    </div>,
    ..._.map(allLabelKeys, k => labels[k]),
    getValue(labels),
  ]);

  const rows = _.orderBy(unsortedRows, [sortBy.index], [sortBy.direction]) as string[][];

  // Set the result table's break point based on the number of columns
  let breakPoint: keyof typeof TableGridBreakpoint = 'grid';
  if (columns.length <= 2) {
    breakPoint = 'none';
  } else if (columns.length <= 5) {
    breakPoint = 'gridMd';
  } else if (columns.length <= 8) {
    breakPoint = 'gridLg';
  } else if (columns.length <= 11) {
    breakPoint = 'gridXl';
  } else if (columns.length <= 14) {
    breakPoint = 'grid2xl';
  }

  const onSort = (e, index, direction) => setSortBy({index, direction});

  return <Table
    cells={columns}
    gridBreakPoint={TableGridBreakpoint[breakPoint]}
    onSort={onSort}
    rows={rows}
    sortBy={sortBy}
    variant={TableVariant.compact}
  >
    <TableHeader />
    <TableBody />
  </Table>;
};

const Query: React.FC<QueryProps> = ({colorOffset, metrics, onBlur, onDelete, onSubmit, onUpdate, queryObj}) => {
  const {allSeries, disabledSeries, enabled, expanded, text, query} = queryObj;

  const toggleEnabled = () => onUpdate({enabled: !enabled, expanded: !enabled, query: enabled ? '' : text});

  const toggleSeries = (labels: Labels) => onUpdate({disabledSeries: _.xorWith(disabledSeries, [labels], _.isEqual)});

  const toggleAllSeries = () => onUpdate({disabledSeries: _.isEmpty(disabledSeries) ? allSeries : []});

  const kebabOptions = [
    {label: `${enabled ? 'Disable' : 'Enable'} query`, callback: toggleEnabled},
    {label: `${_.isEmpty(disabledSeries) ? 'Hide' : 'Show'} all series`, callback: toggleAllSeries},
    {label: 'Delete query', callback: onDelete},
  ];

  const switchLabel = `${enabled ? 'Disable' : 'Enable'} query`;

  return <div className={classNames('query-browser__table', {'query-browser__table--expanded': expanded})}>
    <div className="query-browser__query-controls">
      <ExpandButton isExpanded={expanded} onClick={() => onUpdate({expanded: !expanded})} />
      <QueryInput
        metrics={metrics}
        onBlur={onBlur}
        onSubmit={onSubmit}
        onUpdate={v => onUpdate({text: v})}
        value={text}
      />
      <div title={switchLabel}>
        <Switch aria-label={switchLabel} isChecked={enabled} onChange={toggleEnabled} />
      </div>
      <div className="dropdown-kebab-pf">
        <Kebab options={kebabOptions} />
      </div>
    </div>
    {query && expanded && allSeries && <QueryTable
      allSeries={allSeries}
      colorOffset={colorOffset}
      disabledSeries={disabledSeries}
      query={query}
      toggleSeries={toggleSeries}
    />}
  </div>;
};

const getParamsQueries = () => {
  const queries = [];
  const searchParams = getURLSearchParams();
  for (let i = 0; _.has(searchParams, `query${i}`); ++i) {
    const query = searchParams[`query${i}`];
    queries.push({disabledSeries: [], enabled: true, expanded: true, query, text: query});
  }
  return _.isEmpty(queries) ? undefined : queries;
};

export const QueryBrowserPage = withFallback(() => {
  // `text` is the current string in the text input and `query` is the value displayed in the graph
  const defaultQueryObj = {disabledSeries: [], enabled: true, expanded: true, query: '', text: ''};

  const [focusedQuery, setFocusedQuery] = React.useState();
  const [metrics, setMetrics] = React.useState();
  const [queries, setQueries] = React.useState(getParamsQueries() || [defaultQueryObj]);

  const updateURLParams = () => {
    const newParams = {};
    _.each(queries, (q, i) => newParams[`query${i}`] = q.text);
    setAllQueryArguments(newParams);
  };

  const updateQuery = (i: number, patch: PrometheusQuery) => {
    setQueries(_.map(queries, (q, j) => i === j ? Object.assign({}, q, patch) : q));
  };

  const addQuery = () => setQueries([...queries, defaultQueryObj]);

  const deleteAllQueries = () => setQueries([defaultQueryObj]);

  const runQueries = () => {
    setQueries(queries.map(q => q.enabled ? Object.assign({}, q, {query: _.trim(q.text)}) : q));
    updateURLParams();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runQueries();
  };

  const isAllExpanded = _.every(queries, 'expanded');
  const toggleAllExpanded = () => setQueries(_.map(queries, q => Object.assign({}, q, {expanded: !isAllExpanded})));

  const actionsMenuActions = [
    {label: 'Add query', callback: addQuery},
    {label: `${isAllExpanded ? 'Collapse' : 'Expand'} all query tables`, callback: toggleAllExpanded},
    {label: 'Delete all queries', callback: deleteAllQueries},
  ];

  const onDataUpdate = React.useCallback((allQueries: PrometheusSeries[][]) => {
    const newQueries = _.map(allQueries, (querySeries, i) => {
      const allSeries = _.map(querySeries, 'metric');
      return Object.assign({}, queries[i], {allSeries});
    });
    setQueries(newQueries);
  }, [queries]);

  const onMetricChange = (metric: string) => {
    if (focusedQuery) {
      // Replace the currently selected text with the metric
      const {index, selection, target} = focusedQuery;
      const oldText = _.get(queries, [index, 'text']);
      const text = oldText.substring(0, selection.start) + metric + oldText.substring(selection.end);
      updateQuery(index, {text});
      target.focus();

      // Restore the cursor position / currently selected text (use _.defer() to delay until after the input value is set)
      _.defer(() => target.setSelectionRange(selection.start, selection.start + metric.length));
    } else {
      // No focused query, so add the metric to the end of the first query input
      updateQuery(0, {text: _.get(queries, [0, 'text']) + metric});
    }
  };

  const insertExampleQuery = () => updateQuery(0, {
    text: 'sum(sort_desc(sum_over_time(ALERTS{alertstate="firing"}[24h]))) by (alertname)',
    enabled: true,
  });

  let colorOffset = 0;

  /* eslint-disable react-hooks/exhaustive-deps */
  // Use React.useMemo() to prevent these two arrays being recreated on every render, which would trigger unnecessary
  // re-renders of QueryBrowser, which can be quite slow
  const queriesMemoKey = JSON.stringify(_.map(queries, 'query'));
  const queryStrings = React.useMemo(() => _.map(queries, 'query'), [queriesMemoKey]);
  const disabledSeriesMemoKey = JSON.stringify(_.map(queries, 'disabledSeries'));
  const disabledSeries = React.useMemo(() => _.map(queries, 'disabledSeries'), [disabledSeriesMemoKey]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return <React.Fragment>
    <Helmet>
      <title>Metrics</title>
    </Helmet>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">
        <span>Metrics<HeaderPrometheusLink queries={queryStrings} /></span>
        <div className="co-actions">
          <ActionsMenu actions={actionsMenuActions} />
        </div>
      </h1>
    </div>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12">
          <ToggleGraph />
        </div>
      </div>
      <div className="row">
        <div className="col-xs-12">
          {queryStrings.join('') === ''
            ? <div className="query-browser__wrapper graph-empty-state">
              <EmptyState variant={EmptyStateVariant.full}>
                <EmptyStateIcon size="sm" icon={ChartLineIcon} />
                <Title size="sm">No Query Entered</Title>
                <EmptyStateBody>Enter a query in the box below to explore metrics for this cluster.</EmptyStateBody>
                <Button onClick={insertExampleQuery} variant="primary">Insert Example Query</Button>
              </EmptyState>
            </div>
            : <QueryBrowser
              defaultTimespan={30 * 60 * 1000}
              disabledSeries={disabledSeries}
              onDataUpdate={onDataUpdate}
              queries={queryStrings}
            />}
          <form onSubmit={onSubmit}>
            <div className="query-browser__controls">
              <div className="query-browser__controls--left">
                <MetricsDropdown onChange={onMetricChange} onLoad={setMetrics} />
              </div>
              <div className="query-browser__controls--right">
                <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
                  <Button type="button" className="query-browser__inline-control" onClick={addQuery} variant="secondary">Add Query</Button>
                  <Button type="submit" variant="primary">Run Queries</Button>
                </ActionGroup>
              </div>
            </div>
            {_.map(queries, (q, i) => {
              const deleteQuery = () => setQueries(queries.length <= 1
                ? [defaultQueryObj]
                : queries.filter((v, k) => k !== i));

              const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
                if (_.get(e, 'relatedTarget.id') === 'metrics-dropdown') {
                  // Focus has shifted from a query input to the metrics dropdown, so store the cursor position so we
                  // know where to insert the metric when it is selected
                  setFocusedQuery({
                    index: i,
                    selection: {
                      start: e.target.selectionStart,
                      end: e.target.selectionEnd,
                    },
                    target: e.target,
                  });
                } else {
                  // Focus is shifting to somewhere other than the metrics dropdown, so don't track the cursor position
                  setFocusedQuery(undefined);
                }
              };

              colorOffset += _.get(queries, [i - 1, 'allSeries', 'length'], 0);

              return <Query
                colorOffset={colorOffset}
                key={i}
                metrics={metrics}
                onBlur={onBlur}
                onDelete={deleteQuery}
                onSubmit={runQueries}
                onUpdate={patch => updateQuery(i, patch)}
                queryObj={q}
              />;
            })}
          </form>
        </div>
      </div>
    </div>
  </React.Fragment>;
});

type PrometheusQuery = {
  allSeries?: Labels[];
  disabledSeries?: Labels[];
  enabled?: boolean;
  expanded?: boolean;
  query?: string;
  text?: string;
};
type QueryProps = {
  colorOffset: number;
  metrics: string[],
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onDelete: () => void;
  onSubmit: () => void;
  onUpdate: (patch: PrometheusQuery) => void;
  queryObj: PrometheusQuery;
};
type QueryInputProps = {
  metrics: string[],
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onUpdate: (text: string) => void;
  value: string,
};
type QueryTableProps = {
  allSeries?: Labels[];
  colorOffset: number;
  disabledSeries: Labels[];
  query: string;
  toggleSeries: (labels: Labels) => void;
};
