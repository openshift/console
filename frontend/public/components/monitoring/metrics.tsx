import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { List as ImmutableList } from 'immutable';
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
  ISortBy,
  sortable,
  Table,
  TableBody,
  TableGridBreakpoint,
  TableHeader,
  TableVariant,
  wrappable,
} from '@patternfly/react-table';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { connect, useDispatch, useSelector } from 'react-redux';

import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';

import * as UIActions from '../../actions/ui';
import { RootState } from '../../redux';
import { fuzzyCaseInsensitive } from '../factory/table-filters';
import { PrometheusData, PrometheusLabels, PROMETHEUS_BASE_PATH } from '../graphs';
import { getPrometheusURL, PrometheusEndpoint } from '../graphs/helpers';
import {
  ActionsMenu,
  Dropdown,
  getURLSearchParams,
  Kebab,
  LoadingInline,
  usePoll,
  useSafeFetch,
} from '../utils';
import { setAllQueryArguments } from '../utils/router';
import IntervalDropdown from './poll-interval-dropdown';
import { colors, Error, QueryObj, QueryBrowser } from './query-browser';
import TablePagination from './table-pagination';
import { PrometheusAPIError } from './types';

const operators = [
  'and',
  'by()',
  'group_left()',
  'group_right()',
  'ignoring()',
  'offset',
  'on()',
  'or',
  'unless',
  'without()',
];

const aggregationOperators = [
  'avg()',
  'bottomk()',
  'count()',
  'count_values()',
  'max()',
  'min()',
  'quantile()',
  'stddev()',
  'stdvar()',
  'sum()',
  'topk()',
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

// Stores information about the currently focused query input
let focusedQuery;

const queryDispatchToProps = (dispatch, { index }) => ({
  deleteQuery: () => dispatch(UIActions.queryBrowserDeleteQuery(index)),
  patchQuery: (v: QueryObj) => dispatch(UIActions.queryBrowserPatchQuery(index, v)),
  toggleIsEnabled: () => dispatch(UIActions.queryBrowserToggleIsEnabled(index)),
});

const MetricsActionsMenu_: React.FC<MetricsActionsMenuProps> = ({
  addQuery,
  deleteAll,
  isAllExpanded,
  setAllExpanded,
}) => {
  const { t } = useTranslation();

  const doDelete = () => {
    deleteAll();
    focusedQuery = undefined;
  };

  const actionsMenuActions = [
    { label: t('public~Add query'), callback: addQuery },
    {
      label: isAllExpanded
        ? t('public~Collapse all query tables')
        : t('public~Expand all query tables'),
      callback: () => setAllExpanded(!isAllExpanded),
    },
    { label: t('public~Delete all queries'), callback: doDelete },
  ];

  return (
    <div className="co-actions">
      <ActionsMenu actions={actionsMenuActions} />
    </div>
  );
};
const MetricsActionsMenu = connect(
  ({ UI }: RootState) => ({
    isAllExpanded: UI.getIn(['queryBrowser', 'queries']).every((q) => q.get('isExpanded')),
  }),
  {
    addQuery: UIActions.queryBrowserAddQuery,
    deleteAll: UIActions.queryBrowserDeleteAllQueries,
    setAllExpanded: UIActions.queryBrowserSetAllExpanded,
  },
)(MetricsActionsMenu_);

const graphStateToProps = ({ UI }: RootState) => ({
  hideGraphs: !!UI.getIn(['monitoring', 'hideGraphs']),
});

const ToggleGraph_ = ({ hideGraphs, toggle }) => {
  const { t } = useTranslation();

  const icon = hideGraphs ? <ChartLineIcon /> : <CompressIcon />;

  return (
    <Button
      type="button"
      className="pf-m-link--align-right query-browser__toggle-graph"
      onClick={toggle}
      variant="link"
    >
      {icon} {hideGraphs ? t('public~Show graph') : t('public~Hide graph')}
    </Button>
  );
};
export const ToggleGraph = connect(graphStateToProps, { toggle: UIActions.monitoringToggleGraphs })(
  ToggleGraph_,
);

const MetricsDropdown_: React.FC<MetricsDropdownProps> = ({ insertText, setMetrics }) => {
  const { t } = useTranslation();

  const [items, setItems] = React.useState<MetricsDropdownItems>();
  const [error, setError] = React.useState<PrometheusAPIError>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  React.useEffect(() => {
    safeFetch(`${PROMETHEUS_BASE_PATH}/${PrometheusEndpoint.LABEL}/__name__/values`)
      .then((response) => {
        const metrics = response?.data;
        setItems(_.zipObject(metrics, metrics));
        setMetrics(metrics);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      });
  }, [safeFetch, setMetrics]);

  const onChange = (metric: string) => {
    // Replace the currently selected text with the metric
    const { index = 0, selection = {}, target = undefined } = focusedQuery || {};
    insertText(index, metric, selection.start, selection.end);

    if (target) {
      target.focus();

      // Restore cursor position / currently selected text (use _.defer() to delay until after the input value is set)
      _.defer(() => target.setSelectionRange(selection.start, selection.start + metric.length));
    }
  };

  let title: React.ReactNode = t('public~Insert metric at cursor');
  if (error !== undefined) {
    const message =
      error?.response?.status === 403 ? 'Access restricted.' : 'Failed to load metrics list.';
    title = (
      <span>
        <RedExclamationCircleIcon /> {message}
      </span>
    );
  } else if (items === undefined) {
    title = <LoadingInline />;
  } else if (_.isEmpty(items)) {
    title = (
      <span>
        <YellowExclamationTriangleIcon /> No metrics found.
      </span>
    );
  }

  return (
    <Dropdown
      autocompleteFilter={fuzzyCaseInsensitive}
      disabled={error !== undefined}
      id="metrics-dropdown"
      items={items || {}}
      menuClassName="query-browser__metrics-dropdown-menu query-browser__metrics-dropdown-menu--insert"
      onChange={onChange}
      title={title}
    />
  );
};
const MetricsDropdown = connect(null, {
  insertText: UIActions.queryBrowserInsertText,
  setMetrics: UIActions.queryBrowserSetMetrics,
})(MetricsDropdown_);

const ExpandButton = ({ isExpanded, onClick }) => {
  const title = `${isExpanded ? 'Hide' : 'Show'} Table`;
  return (
    <Button
      aria-label={title}
      className="query-browser__expand-button"
      onClick={onClick}
      title={title}
      variant="plain"
    >
      {isExpanded ? (
        <AngleDownIcon className="query-browser__expand-icon" />
      ) : (
        <AngleRightIcon className="query-browser__expand-icon" />
      )}
    </Button>
  );
};

const seriesButtonStateToProps = ({ UI }: RootState, { index, labels }) => {
  const disabledSeries = UI.getIn(['queryBrowser', 'queries', index, 'disabledSeries']);
  const isDisabled = _.some(disabledSeries, (s) => _.isEqual(s, labels));
  if (!isDisabled) {
    const series = UI.getIn(['queryBrowser', 'queries', index, 'series']);
    if (_.isEmpty(series)) {
      return { colorIndex: null, isDisabled, isSeriesEmpty: true };
    }
    const colorOffset = UI.getIn(['queryBrowser', 'queries'])
      .take(index)
      .filter((q) => q.get('isEnabled'))
      .reduce((sum, q) => sum + _.size(q.get('series')), 0);
    const seriesIndex = _.findIndex(series, (s) => _.isEqual(s, labels));
    const colorIndex = (colorOffset + seriesIndex) % colors.length;
    return { colorIndex, isDisabled };
  }
  return { colorIndex: null, isDisabled };
};

const SeriesButton_: React.FC<SeriesButtonProps> = ({
  colorIndex,
  isDisabled,
  isSeriesEmpty = false,
  toggleSeries,
}) => {
  if (isSeriesEmpty) {
    return <div className="query-browser__series-btn-wrap"></div>;
  }
  const title = `${isDisabled ? 'Show' : 'Hide'} series`;

  return (
    <div className="query-browser__series-btn-wrap">
      <Button
        aria-label={title}
        className={classNames('query-browser__series-btn', {
          'query-browser__series-btn--disabled': isDisabled,
        })}
        onClick={toggleSeries}
        style={colorIndex === null ? undefined : { backgroundColor: colors[colorIndex] }}
        title={title}
        type="button"
        variant="plain"
      />
    </div>
  );
};
const SeriesButton = connect(seriesButtonStateToProps, (dispatch, { index, labels }) => ({
  toggleSeries: () => dispatch(UIActions.queryBrowserToggleSeries(index, labels)),
}))(SeriesButton_);

const queryInputStateToProps = ({ UI }: RootState, { index }) => ({
  metrics: UI.getIn(['queryBrowser', 'metrics']),
  text: UI.getIn(['queryBrowser', 'queries', index, 'text']),
});

// Highlight characters in `text` based on the search string `token`
const HighlightMatches: React.FC<{ text: string; token: string }> = ({ text, token }) => {
  // Autocompletion uses fuzzy matching, so the entire `token` string may not be a substring of
  // `text`. Instead, we find the longest starting substring of `token` that exists in `text` and
  // highlight it. Then we repeat with the remainder of `token` and `text` and continue until all
  // the characters of `token` have been found somewhere in `text`.
  for (let sub = token; sub.length > 0; sub = sub.slice(0, -1)) {
    const i = text.toLowerCase().indexOf(sub);
    if (i !== -1) {
      return (
        <>
          {text.slice(0, i)}
          <span className="query-browser__autocomplete-match">{text.slice(i, i + sub.length)}</span>
          <HighlightMatches text={text.slice(i + sub.length)} token={token.slice(sub.length)} />
        </>
      );
    }
  }
  return <>{text}</>;
};

const QueryInput_: React.FC<QueryInputProps> = ({
  index,
  metrics,
  patchQuery,
  runQueries,
  text = '',
}) => {
  const { t } = useTranslation();

  const [token, setToken] = React.useState('');

  const inputRef = React.useRef(null);

  const getTextBeforeCursor = () =>
    inputRef.current.value.substring(0, inputRef.current.selectionEnd);

  const updateToken = _.debounce(() => {
    // Metric and function names can only contain the characters a-z, A-Z, 0-9, '_' and ':'
    const allTokens = getTextBeforeCursor().split(/[^a-zA-Z0-9_:]+/);

    // We always do case insensitive autocompletion, so convert to lower case immediately
    setToken(_.toLower(_.last(allTokens)));
  }, 200);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    patchQuery({ text: e.target.value });
    updateToken();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter+Shift inserts newlines, Enter alone runs the query
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runQueries();
      setToken('');
    }
  };

  const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    focusedQuery = {
      index,
      selection: {
        start: e.target.selectionStart,
        end: e.target.selectionEnd,
      },
      target: e.target,
    };
    setToken('');
  };

  // Use onMouseDown instead of onClick so that this is run before the onBlur handler
  const onMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Replace the autocomplete token with the selected autocomplete option (case insensitive)
    const re = new RegExp(`${_.escapeRegExp(token)}$`, 'i');
    const newTextBeforeCursor = getTextBeforeCursor().replace(
      re,
      e.currentTarget.dataset.autocomplete,
    );
    patchQuery({ text: newTextBeforeCursor + text.substring(inputRef.current.selectionEnd) });

    // Move cursor to just after the text we inserted (use _.defer() so this is called after the textarea value is set)
    const cursorPosition = newTextBeforeCursor.length;
    _.defer(() => {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      inputRef.current.focus();
    });
  };

  const onClear = () => {
    patchQuery({ text: '' });
    inputRef.current.focus();
  };

  // Order autocompletion suggestions so that exact matches (token as a substring) are first, then fuzzy matches after
  // Exact matches are sorted first by how early the token appears and secondarily by string length (shortest first)
  // Fuzzy matches are sorted by string length (shortest first)
  const isMatch = (v: string) => fuzzyCaseInsensitive(token, v);
  const matchScore = (v: string): number => {
    const i = v.toLowerCase().indexOf(token);
    return i === -1 ? Infinity : i;
  };
  const filterSuggestions = (options: string[]): string[] =>
    _.sortBy(options.filter(isMatch), [matchScore, 'length']);

  const allSuggestions =
    token.length < 2
      ? {}
      : _.omitBy(
          {
            ['Operators']: filterSuggestions(operators),
            ['Aggregation Operators']: filterSuggestions(aggregationOperators),
            ['Functions']: filterSuggestions(prometheusFunctions),
            ['Metrics']: filterSuggestions(metrics),
          },
          _.isEmpty,
        );

  // Set the default textarea height to the number of lines in the query text
  const rows = _.clamp((text.match(/\n/g) || []).length + 1, 2, 10);

  const placeholder = t('public~Expression (press Shift+Enter for newlines)');

  return (
    <div className="query-browser__query pf-c-dropdown">
      <textarea
        aria-label={placeholder}
        autoFocus
        className="pf-c-form-control query-browser__query-input"
        onBlur={onBlur}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        ref={inputRef}
        rows={rows}
        spellCheck={false}
        value={text}
      />
      <Button
        className="query-browser__clear-icon"
        aria-label={t('public~Clear query')}
        onClick={onClear}
        type="button"
        variant="plain"
      >
        <TimesIcon />
      </Button>
      {!_.isEmpty(allSuggestions) && (
        <ul className="pf-c-dropdown__menu query-browser__metrics-dropdown-menu">
          {_.map(allSuggestions, (suggestions, title) => (
            <React.Fragment key={title}>
              <div className="text-muted query-browser__dropdown--subtitle">{title}</div>
              {_.map(suggestions, (s) => (
                <li key={s}>
                  <button
                    className="pf-c-dropdown__menu-item"
                    data-autocomplete={s}
                    onMouseDown={onMouseDown}
                    type="button"
                  >
                    <HighlightMatches text={s} token={token} />
                  </button>
                </li>
              ))}
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
};

const queryInputDispatchToProps = (dispatch, props) =>
  Object.assign(
    { runQueries: () => dispatch(UIActions.queryBrowserRunQueries()) },
    queryDispatchToProps(dispatch, props),
  );

export const QueryInput = connect(queryInputStateToProps, queryInputDispatchToProps)(QueryInput_);

const QueryKebab_: React.FC<QueryKebabProps> = ({
  deleteQuery,
  isDisabledSeriesEmpty,
  isEnabled,
  patchQuery,
  series,
  toggleIsEnabled,
}) => {
  const { t } = useTranslation();

  const toggleAllSeries = () => patchQuery({ disabledSeries: isDisabledSeriesEmpty ? series : [] });

  const doDelete = () => {
    deleteQuery();
    focusedQuery = undefined;
  };

  return (
    <Kebab
      options={[
        {
          label: isEnabled ? t('public~Disable query') : t('public~Enable query'),
          callback: toggleIsEnabled,
        },
        {
          label: isDisabledSeriesEmpty ? t('public~Hide all series') : t('public~Show all series'),
          callback: toggleAllSeries,
        },
        { label: t('public~Delete query'), callback: doDelete },
      ]}
    />
  );
};
const QueryKebab = connect(
  ({ UI }: RootState, { index }) => ({
    isDisabledSeriesEmpty: _.isEmpty(
      UI.getIn(['queryBrowser', 'queries', index, 'disabledSeries']),
    ),
    isEnabled: UI.getIn(['queryBrowser', 'queries', index, 'isEnabled']),
    series: UI.getIn(['queryBrowser', 'queries', index, 'series']),
  }),
  queryDispatchToProps,
)(QueryKebab_);

const queryTableStateToProps = ({ UI }: RootState, { index }) => ({
  isEnabled: UI.getIn(['queryBrowser', 'queries', index, 'isEnabled']),
  isExpanded: UI.getIn(['queryBrowser', 'queries', index, 'isExpanded']),
  pollInterval: UI.getIn(['queryBrowser', 'pollInterval']),
  query: UI.getIn(['queryBrowser', 'queries', index, 'query']),
  series: UI.getIn(['queryBrowser', 'queries', index, 'series']),
});

const QueryTable_: React.FC<QueryTableProps> = ({
  index,
  isEnabled,
  isExpanded,
  namespace,
  pollInterval = 15 * 1000,
  query,
  series,
}) => {
  const { t } = useTranslation();

  const [data, setData] = React.useState<PrometheusData>();
  const [error, setError] = React.useState<PrometheusAPIError>();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(50);
  const [sortBy, setSortBy] = React.useState<ISortBy>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  const tick = () => {
    if (isEnabled && isExpanded && query) {
      safeFetch(getPrometheusURL({ endpoint: PrometheusEndpoint.QUERY, namespace, query }))
        .then((response) => {
          setData(_.get(response, 'data'));
          setError(undefined);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setData(undefined);
            setError(err);
          }
        });
    }
  };

  usePoll(tick, pollInterval, namespace, query);

  React.useEffect(() => {
    setData(undefined);
    setError(undefined);
    setPage(1);
    setSortBy(undefined);
  }, [namespace, query]);

  if (!isEnabled || !isExpanded || !query) {
    return null;
  }

  if (error) {
    return (
      <div className="query-browser__table-message">
        <Error error={error} title="Error loading values" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="query-browser__table-message">
        <LoadingInline />
      </div>
    );
  }

  // Add any data series from `series` (those displayed in the graph) that are not in `data.result`.
  // This happens for queries that exclude a series currently, but included that same series at some
  // point during the graph's range.
  const expiredSeries = _.differenceWith(series, data.result, (s, r) => _.isEqual(s, r.metric));
  const result = expiredSeries.length
    ? [...data.result, ...expiredSeries.map((metric) => ({ metric }))]
    : data.result;

  if (!result || result.length === 0) {
    return (
      <div className="query-browser__table-message">
        <YellowExclamationTriangleIcon /> {t('public~No datapoints found.')}
      </div>
    );
  }

  const cellProps = {
    props: { className: 'query-browser__table-cell' },
    transforms: [sortable, wrappable],
  };

  const buttonCell = (labels) => ({ title: <SeriesButton index={index} labels={labels} /> });

  let columns, rows;
  if (data.resultType === 'scalar') {
    columns = ['', { title: t('public~Value'), ...cellProps }];
    rows = [[buttonCell({}), _.get(result, '[1]')]];
  } else if (data.resultType === 'string') {
    columns = [{ title: t('public~Value'), ...cellProps }];
    rows = [[result?.[1]]];
  } else {
    const allLabelKeys = _.uniq(_.flatMap(result, ({ metric }) => Object.keys(metric))).sort();

    columns = [
      '',
      ...allLabelKeys.map((k) => ({
        title: <span>{k === '__name__' ? t('public~Name') : k}</span>,
        ...cellProps,
      })),
      { title: t('public~Value'), ...cellProps },
    ];

    let rowMapper;
    if (data.resultType === 'matrix') {
      rowMapper = ({ metric, values }) => [
        '',
        ..._.map(allLabelKeys, (k) => metric[k]),
        {
          title: (
            <>
              {_.map(values, ([time, v]) => (
                <div key={time}>
                  {v}&nbsp;@{time}
                </div>
              ))}
            </>
          ),
        },
      ];
    } else {
      rowMapper = ({ metric, value }) => [
        buttonCell(metric),
        ..._.map(allLabelKeys, (k) => metric[k]),
        _.get(value, '[1]', { title: <span className="text-muted">None</span> }),
      ];
    }

    rows = _.map(result, rowMapper);
    if (sortBy) {
      // Sort Values column numerically and sort all the other columns alphabetically
      const valuesColIndex = allLabelKeys.length + 1;
      const sort =
        sortBy.index === valuesColIndex
          ? (cells) => {
              const v = Number(cells[valuesColIndex]);
              return Number.isNaN(v) ? 0 : v;
            }
          : `${sortBy.index}`;
      rows = _.orderBy(rows, [sort], [sortBy.direction]);
    }
  }

  const onSort = (e, i, direction) => setSortBy({ index: i, direction });

  const tableRows = rows.slice((page - 1) * perPage, page * perPage).map((cells) => ({ cells }));

  return (
    <>
      <div className="query-browser__table-wrapper">
        <Table
          aria-label="query results table"
          cells={columns}
          gridBreakPoint={TableGridBreakpoint.none}
          onSort={onSort}
          rows={tableRows}
          sortBy={sortBy}
          variant={TableVariant.compact}
        >
          <TableHeader />
          <TableBody />
        </Table>
      </div>
      <TablePagination
        itemCount={rows.length}
        page={page}
        perPage={perPage}
        setPage={setPage}
        setPerPage={setPerPage}
      />
    </>
  );
};
export const QueryTable = connect(queryTableStateToProps, queryDispatchToProps)(QueryTable_);

const Query_: React.FC<QueryProps> = ({
  id,
  index,
  isExpanded,
  isEnabled,
  patchQuery,
  toggleIsEnabled,
}) => {
  const { t } = useTranslation();

  const switchKey = `${id}-${isEnabled}`;
  const switchLabel = isEnabled ? t('public~Disable query') : t('public~Enable query');

  const toggleIsExpanded = () => patchQuery({ isExpanded: !isExpanded });

  return (
    <div
      className={classNames('query-browser__table', {
        'query-browser__table--expanded': isExpanded,
      })}
    >
      <div className="query-browser__query-controls">
        <ExpandButton isExpanded={isExpanded} onClick={toggleIsExpanded} />
        <QueryInput index={index} />
        <div title={switchLabel}>
          <Switch
            aria-label={switchLabel}
            id={switchKey}
            isChecked={isEnabled}
            key={switchKey}
            onChange={toggleIsEnabled}
          />
        </div>
        <div className="dropdown-kebab-pf">
          <QueryKebab index={index} />
        </div>
      </div>
      <QueryTable index={index} />
    </div>
  );
};
const Query = connect(
  ({ UI }: RootState, { index }) => ({
    id: UI.getIn(['queryBrowser', 'queries', index, 'id']),
    isEnabled: UI.getIn(['queryBrowser', 'queries', index, 'isEnabled']),
    isExpanded: UI.getIn(['queryBrowser', 'queries', index, 'isExpanded']),
  }),
  queryDispatchToProps,
)(Query_);

const QueryBrowserWrapper_: React.FC<QueryBrowserWrapperProps> = ({
  hideGraphs,
  patchQuery,
  queriesList,
}) => {
  const { t } = useTranslation();

  const queries = queriesList.toJS();

  // Initialize queries from URL parameters
  React.useEffect(() => {
    const searchParams = getURLSearchParams();
    for (let i = 0; _.has(searchParams, `query${i}`); ++i) {
      const query = searchParams[`query${i}`];
      patchQuery(i, { isEnabled: true, isExpanded: true, query, text: query });
    }
  }, [patchQuery]);

  /* eslint-disable react-hooks/exhaustive-deps */
  // Use React.useMemo() to prevent these two arrays being recreated on every render, which would trigger unnecessary
  // re-renders of QueryBrowser, which can be quite slow
  const queriesMemoKey = JSON.stringify(_.map(queries, 'query'));
  const queryStrings = React.useMemo(() => _.map(queries, 'query'), [queriesMemoKey]);
  const disabledSeriesMemoKey = JSON.stringify(
    _.reject(_.map(queries, 'disabledSeries'), _.isEmpty),
  );
  const disabledSeries = React.useMemo(() => _.map(queries, 'disabledSeries'), [
    disabledSeriesMemoKey,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Update the URL parameters when the queries shown in the graph change
  React.useEffect(() => {
    const newParams = {};
    _.each(queryStrings, (q, i) => (newParams[`query${i}`] = q || ''));
    setAllQueryArguments(newParams);
  }, [queryStrings]);

  if (hideGraphs) {
    return null;
  }

  const insertExampleQuery = () => {
    const focusedIndex = focusedQuery?.index ?? 0;
    const index = queries[focusedIndex] ? focusedIndex : 0;
    const text = 'sort_desc(sum(sum_over_time(ALERTS{alertstate="firing"}[24h])) by (alertname))';
    patchQuery(index, { isEnabled: true, query: text, text });
  };

  if (queryStrings.join('') === '') {
    return (
      <div className="query-browser__wrapper graph-empty-state">
        <EmptyState variant={EmptyStateVariant.full}>
          <EmptyStateIcon icon={ChartLineIcon} />
          <Title headingLevel="h2" size="md">
            {t('public~No query entered')}
          </Title>
          <EmptyStateBody>
            {t('public~Enter a query in the box below to explore metrics for this cluster.')}
          </EmptyStateBody>
          <Button onClick={insertExampleQuery} variant="primary">
            {t('public~Insert example query')}
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <QueryBrowser
      defaultTimespan={30 * 60 * 1000}
      disabledSeries={disabledSeries}
      queries={queryStrings}
      showStackedControl
    />
  );
};
const QueryBrowserWrapper = connect(
  ({ UI }: RootState) => ({
    hideGraphs: !!UI.getIn(['monitoring', 'hideGraphs']),
    queriesList: UI.getIn(['queryBrowser', 'queries']),
  }),
  { patchQuery: UIActions.queryBrowserPatchQuery },
)(QueryBrowserWrapper_);

const AddQueryButton_ = ({ addQuery }) => {
  const { t } = useTranslation();

  return (
    <Button
      className="query-browser__inline-control"
      onClick={addQuery}
      type="button"
      variant="secondary"
    >
      {t('public~Add query')}
    </Button>
  );
};
const AddQueryButton = connect(null, { addQuery: UIActions.queryBrowserAddQuery })(AddQueryButton_);

const RunQueriesButton_ = ({ runQueries }) => {
  const { t } = useTranslation();

  return (
    <Button onClick={runQueries} type="submit" variant="primary">
      {t('public~Run queries')}
    </Button>
  );
};
const RunQueriesButton = connect(null, { runQueries: UIActions.queryBrowserRunQueries })(
  RunQueriesButton_,
);

const QueriesList_ = ({ count }) => (
  <>
    {_.range(count).map((i) => (
      <Query index={i} key={i} />
    ))}
  </>
);
const QueriesList = connect(({ UI }: RootState) => ({
  count: UI.getIn(['queryBrowser', 'queries']).size,
}))(QueriesList_);

const PollIntervalDropdown = () => {
  const interval = useSelector(({ UI }: RootState) => UI.getIn(['queryBrowser', 'pollInterval']));

  const dispatch = useDispatch();
  const setInterval = React.useCallback(
    (v: number) => dispatch(UIActions.queryBrowserSetPollInterval(v)),
    [dispatch],
  );

  return <IntervalDropdown interval={interval} setInterval={setInterval} />;
};

const QueryBrowserPage_: React.FC<QueryBrowserPageProps> = ({ deleteAll }) => {
  const { t } = useTranslation();

  // Clear queries on unmount
  React.useEffect(() => deleteAll, [deleteAll]);

  return (
    <>
      <Helmet>
        <title>{t('public~Metrics')}</title>
      </Helmet>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading">
          <span>{t('public~Metrics')}</span>
          <div className="co-actions">
            <PollIntervalDropdown />
            <MetricsActionsMenu />
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
            <QueryBrowserWrapper />
            <div className="query-browser__controls">
              <div className="query-browser__controls--left">
                <MetricsDropdown />
              </div>
              <div className="query-browser__controls--right">
                <ActionGroup className="pf-c-form pf-c-form__group--no-top-margin">
                  <AddQueryButton />
                  <RunQueriesButton />
                </ActionGroup>
              </div>
            </div>
            <QueriesList />
          </div>
        </div>
      </div>
    </>
  );
};
export const QueryBrowserPage = withFallback(
  connect(null, { deleteAll: UIActions.queryBrowserDeleteAllQueries })(QueryBrowserPage_),
);

type MetricsActionsMenuProps = {
  addQuery: () => never;
  deleteAll: () => never;
  isAllExpanded: boolean;
  setAllExpanded: (isExpanded: boolean) => never;
};

type MetricsDropdownItems = {
  [key: string]: string;
};

type MetricsDropdownProps = {
  insertText: (index: number, newText: string, replaceFrom: number, replaceTo: number) => never;
  setMetrics: (metrics: string[]) => never;
};

type QueryBrowserPageProps = {
  deleteAll: () => never;
};

type QueryBrowserWrapperProps = {
  hideGraphs: boolean;
  patchQuery: (index: number, patch: QueryObj) => any;
  queriesList: ImmutableList<QueryObj>;
};

type QueryInputProps = {
  index: number;
  metrics: string[];
  patchQuery: (patch: QueryObj) => void;
  runQueries: () => never;
  text?: string;
};

type QueryKebabProps = {
  deleteQuery: () => never;
  isDisabledSeriesEmpty: boolean;
  isEnabled: boolean;
  patchQuery: (patch: QueryObj) => void;
  series: PrometheusLabels[];
  toggleIsEnabled: () => never;
};

type QueryProps = {
  id: string;
  index: number;
  isEnabled: boolean;
  isExpanded: boolean;
  patchQuery: (patch: QueryObj) => void;
  toggleIsEnabled: () => never;
};

type QueryTableProps = {
  index: number;
  isEnabled: boolean;
  isExpanded: boolean;
  namespace?: string;
  pollInterval: number;
  query: string;
  series: PrometheusLabels[];
};

type SeriesButtonProps = {
  colorIndex: number;
  isSeriesEmpty?: boolean;
  isDisabled: boolean;
  toggleSeries: () => never;
};
