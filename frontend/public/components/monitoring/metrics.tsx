import classNames from 'classnames';
import * as _ from 'lodash-es';
import {
  PrometheusData,
  PrometheusEndpoint,
  PrometheusLabels,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk';
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
import { useDispatch, useSelector } from 'react-redux';

import { withFallback } from '@console/shared/src/components/error';

import {
  queryBrowserAddQuery,
  queryBrowserDuplicateQuery,
  queryBrowserDeleteAllQueries,
  queryBrowserDeleteQuery,
  queryBrowserInsertText,
  queryBrowserPatchQuery,
  queryBrowserRunQueries,
  queryBrowserSetAllExpanded,
  queryBrowserSetMetrics,
  queryBrowserSetPollInterval,
  queryBrowserToggleIsEnabled,
  queryBrowserToggleSeries,
  toggleGraphs,
} from '../../actions/observe';
import { RootState } from '../../redux';
import { PROMETHEUS_BASE_PATH } from '../graphs';
import { getPrometheusURL } from '../graphs/helpers';
import {
  ActionsMenu,
  AsyncComponent,
  Dropdown,
  getURLSearchParams,
  Kebab,
  LoadingInline,
  usePoll,
  useSafeFetch,
} from '../utils';
import { setAllQueryArguments } from '../utils/router';
import IntervalDropdown from './poll-interval-dropdown';
import { colors, Error, QueryBrowser } from './query-browser';
import TablePagination from './table-pagination';
import { PrometheusAPIError } from './types';

// Stores information about the currently focused query input
let focusedQuery;

const MetricsActionsMenu: React.FC<{}> = () => {
  const { t } = useTranslation();

  const isAllExpanded = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries']).every((q) => q.get('isExpanded')),
  );

  const dispatch = useDispatch();
  const addQuery = React.useCallback(() => dispatch(queryBrowserAddQuery()), [dispatch]);

  const doDelete = () => {
    dispatch(queryBrowserDeleteAllQueries());
    focusedQuery = undefined;
  };

  const actionsMenuActions = [
    { label: t('public~Add query'), callback: addQuery },
    {
      label: isAllExpanded
        ? t('public~Collapse all query tables')
        : t('public~Expand all query tables'),
      callback: () => dispatch(queryBrowserSetAllExpanded(!isAllExpanded)),
    },
    { label: t('public~Delete all queries'), callback: doDelete },
  ];

  return (
    <div className="co-actions">
      <ActionsMenu actions={actionsMenuActions} />
    </div>
  );
};

export const ToggleGraph: React.FC<{}> = () => {
  const { t } = useTranslation();

  const hideGraphs = useSelector(({ observe }: RootState) => !!observe.get('hideGraphs'));

  const dispatch = useDispatch();
  const toggle = React.useCallback(() => dispatch(toggleGraphs()), [dispatch]);

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

const metricsFilter = (a: string, b: string): boolean => b.includes(a);

const MetricsDropdown: React.FC<{}> = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const [items, setItems] = React.useState<MetricsDropdownItems>();
  const [error, setError] = React.useState<PrometheusAPIError>();

  const safeFetch = React.useCallback(useSafeFetch(), []);

  React.useEffect(() => {
    safeFetch(`${PROMETHEUS_BASE_PATH}/${PrometheusEndpoint.LABEL}/__name__/values`)
      .then((response) => {
        const metrics = response?.data;
        setItems(_.zipObject(metrics, metrics));
        dispatch(queryBrowserSetMetrics(metrics));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      });
  }, [dispatch, safeFetch]);

  const onChange = (metric: string) => {
    // Replace the currently selected text with the metric
    const { index = 0, selection = {}, target = undefined } = focusedQuery || {};
    dispatch(queryBrowserInsertText(index, metric, selection.start, selection.end));

    if (target) {
      target.focus();

      // Restore cursor position / currently selected text (use _.defer() to delay until after the
      // input value is set)
      _.defer(() => target.setSelectionRange(selection.start, selection.start + metric.length));
    }
  };

  let title: React.ReactElement = <>{t('public~Insert metric at cursor')}</>;
  if (error !== undefined) {
    const message =
      error?.response?.status === 403
        ? t('public~Access restricted.')
        : t('public~Failed to load metrics list.');
    title = (
      <>
        <RedExclamationCircleIcon /> {message}
      </>
    );
  } else if (items === undefined) {
    title = <LoadingInline />;
  } else if (_.isEmpty(items)) {
    title = (
      <>
        <YellowExclamationTriangleIcon /> {t('public~No metrics found.')}
      </>
    );
  }

  return (
    <Dropdown
      autocompleteFilter={metricsFilter}
      disabled={error !== undefined}
      id="metrics-dropdown"
      items={items || {}}
      menuClassName="query-browser__metrics-dropdown-menu query-browser__metrics-dropdown-menu--insert"
      onChange={onChange}
      title={title}
    />
  );
};

const ExpandButton = ({ isExpanded, onClick }) => {
  const { t } = useTranslation();
  const title = isExpanded ? t('public~Hide table') : t('public~Show table');
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

const SeriesButton: React.FC<SeriesButtonProps> = ({ index, labels }) => {
  const { t } = useTranslation();

  const [colorIndex, isDisabled, isSeriesEmpty] = useSelector(({ observe }: RootState) => {
    const disabledSeries = observe.getIn(['queryBrowser', 'queries', index, 'disabledSeries']);
    if (_.some(disabledSeries, (s) => _.isEqual(s, labels))) {
      return [null, true, false];
    }

    const series = observe.getIn(['queryBrowser', 'queries', index, 'series']);
    if (_.isEmpty(series)) {
      return [null, false, true];
    }

    const colorOffset = observe
      .getIn(['queryBrowser', 'queries'])
      .take(index)
      .filter((q) => q.get('isEnabled'))
      .reduce((sum, q) => sum + _.size(q.get('series')), 0);
    const seriesIndex = _.findIndex(series, (s) => _.isEqual(s, labels));
    return [(colorOffset + seriesIndex) % colors.length, false, false];
  });

  const dispatch = useDispatch();
  const toggleSeries = React.useCallback(() => dispatch(queryBrowserToggleSeries(index, labels)), [
    dispatch,
    index,
    labels,
  ]);

  if (isSeriesEmpty) {
    return <div className="query-browser__series-btn-wrap"></div>;
  }
  const title = isDisabled ? t('public~Show series') : t('public~Hide series');

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

const QueryKebab: React.FC<{ index: number }> = ({ index }) => {
  const { t } = useTranslation();

  const isDisabledSeriesEmpty = useSelector(({ observe }: RootState) =>
    _.isEmpty(observe.getIn(['queryBrowser', 'queries', index, 'disabledSeries'])),
  );
  const isEnabled = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'isEnabled']),
  );
  const series = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'series']),
  );

  const dispatch = useDispatch();

  const toggleIsEnabled = React.useCallback(() => dispatch(queryBrowserToggleIsEnabled(index)), [
    dispatch,
    index,
  ]);

  const toggleAllSeries = React.useCallback(
    () =>
      dispatch(
        queryBrowserPatchQuery(index, {
          disabledSeries: isDisabledSeriesEmpty ? series : [],
        }),
      ),
    [dispatch, index, isDisabledSeriesEmpty, series],
  );

  const doDelete = React.useCallback(() => {
    dispatch(queryBrowserDeleteQuery(index));
    focusedQuery = undefined;
  }, [dispatch, index]);

  const doClone = React.useCallback(() => {
    dispatch(queryBrowserDuplicateQuery(index));
  }, [dispatch, index]);

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
        { label: t('public~Duplicate query'), callback: doClone },
      ]}
    />
  );
};

export const QueryTable: React.FC<QueryTableProps> = ({ index, namespace }) => {
  const { t } = useTranslation();

  const [data, setData] = React.useState<PrometheusData>();
  const [error, setError] = React.useState<PrometheusAPIError>();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(50);
  const [sortBy, setSortBy] = React.useState<ISortBy>({});

  const isEnabled = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'isEnabled']),
  );
  const isExpanded = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'isExpanded']),
  );
  const pollInterval = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'pollInterval'], 15 * 1000),
  );
  const query = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'query']),
  );
  const series = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'series']),
  );
  const span = useSelector(({ observe }: RootState) => observe.getIn(['queryBrowser', 'timespan']));

  const lastRequestTime = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'lastRequestTime']),
  );

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

  usePoll(tick, pollInterval, namespace, query, span, lastRequestTime);

  React.useEffect(() => {
    setData(undefined);
    setError(undefined);
    setPage(1);
    setSortBy({});
  }, [namespace, query]);

  if (!isEnabled || !isExpanded || !query) {
    return null;
  }

  if (error) {
    return (
      <div className="query-browser__table-message">
        <Error error={error} title={t('public~Error loading values')} />
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

  const transforms = [sortable, wrappable];

  const buttonCell = (labels) => ({ title: <SeriesButton index={index} labels={labels} /> });

  let columns, rows;
  if (data.resultType === 'scalar') {
    columns = ['', { title: t('public~Value'), transforms }];
    rows = [[buttonCell({}), _.get(result, '[1]')]];
  } else if (data.resultType === 'string') {
    columns = [{ title: t('public~Value'), transforms }];
    rows = [[result?.[1]]];
  } else {
    const allLabelKeys = _.uniq(_.flatMap(result, ({ metric }) => Object.keys(metric))).sort();

    columns = [
      '',
      ...allLabelKeys.map((k) => ({
        title: <span>{k === '__name__' ? t('public~Name') : k}</span>,
        transforms,
      })),
      { title: t('public~Value'), transforms },
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
        _.get(value, '[1]', { title: <span className="text-muted">{t('public~None')}</span> }),
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
        <div className="horizontal-scroll">
          <Table
            aria-label={t('public~query results table')}
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

const PromQLExpressionInput = (props) => (
  <AsyncComponent
    loader={() => import('./promql-expression-input').then((c) => c.PromQLExpressionInput)}
    {...props}
  />
);

const Query: React.FC<{ index: number }> = ({ index }) => {
  const { t } = useTranslation();

  const id = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'id']),
  );
  const isEnabled = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'isEnabled']),
  );
  const isExpanded = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'isExpanded']),
  );
  const text = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', index, 'text'], ''),
  );

  const dispatch = useDispatch();

  const toggleIsEnabled = React.useCallback(() => dispatch(queryBrowserToggleIsEnabled(index)), [
    dispatch,
    index,
  ]);

  const toggleIsExpanded = React.useCallback(
    () => dispatch(queryBrowserPatchQuery(index, { isExpanded: !isExpanded })),
    [dispatch, index, isExpanded],
  );

  const handleTextChange = React.useCallback(
    (value: string) => {
      dispatch(queryBrowserPatchQuery(index, { text: value }));
    },
    [dispatch, index],
  );

  const handleExecuteQueries = React.useCallback(() => {
    dispatch(queryBrowserRunQueries());
  }, [dispatch]);

  const handleSelectionChange = (
    target: { focus: () => void; setSelectionRange: (start: number, end: number) => void },
    start: number,
    end: number,
  ) => {
    focusedQuery = { index, selection: { start, end }, target };
  };

  const switchKey = `${id}-${isEnabled}`;
  const switchLabel = isEnabled ? t('public~Disable query') : t('public~Enable query');

  return (
    <div
      className={classNames('query-browser__table', {
        'query-browser__table--expanded': isExpanded,
      })}
    >
      <div className="query-browser__query-controls">
        <ExpandButton isExpanded={isExpanded} onClick={toggleIsExpanded} />
        <PromQLExpressionInput
          value={text}
          onValueChange={handleTextChange}
          onExecuteQuery={handleExecuteQueries}
          onSelectionChange={handleSelectionChange}
        />
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

const QueryBrowserWrapper: React.FC<{}> = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const hideGraphs = useSelector(({ observe }: RootState) => !!observe.get('hideGraphs'));
  const queriesList = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries']),
  );

  const queries = queriesList.toJS();

  // Initialize queries from URL parameters
  React.useEffect(() => {
    const searchParams = getURLSearchParams();
    for (let i = 0; _.has(searchParams, `query${i}`); ++i) {
      const query = searchParams[`query${i}`];
      dispatch(
        queryBrowserPatchQuery(i, {
          isEnabled: true,
          isExpanded: true,
          query,
          text: query,
        }),
      );
    }
  }, [dispatch]);

  /* eslint-disable react-hooks/exhaustive-deps */
  // Use React.useMemo() to prevent these two arrays being recreated on every render, which would
  // trigger unnecessary re-renders of QueryBrowser, which can be quite slow
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
    dispatch(queryBrowserPatchQuery(index, { isEnabled: true, query: text, text }));
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

const AddQueryButton: React.FC<{}> = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const addQuery = React.useCallback(() => dispatch(queryBrowserAddQuery()), [dispatch]);

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

const RunQueriesButton: React.FC<{}> = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const runQueries = React.useCallback(() => dispatch(queryBrowserRunQueries()), [dispatch]);

  return (
    <Button onClick={runQueries} type="submit" variant="primary">
      {t('public~Run queries')}
    </Button>
  );
};

const QueriesList: React.FC<{}> = () => {
  const count = useSelector(
    ({ observe }: RootState) => observe.getIn(['queryBrowser', 'queries']).size,
  );

  return (
    <>
      {_.range(count).map((i) => (
        <Query index={i} key={i} />
      ))}
    </>
  );
};

const PollIntervalDropdown = () => {
  const interval = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'pollInterval']),
  );

  const dispatch = useDispatch();
  const setInterval = React.useCallback((v: number) => dispatch(queryBrowserSetPollInterval(v)), [
    dispatch,
  ]);

  return <IntervalDropdown interval={interval} setInterval={setInterval} />;
};

const QueryBrowserPage_: React.FC<{}> = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  // Clear queries on unmount
  React.useEffect(() => () => dispatch(queryBrowserDeleteAllQueries()), [dispatch]);

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
export const QueryBrowserPage = withFallback(QueryBrowserPage_);

type MetricsDropdownItems = {
  [key: string]: string;
};

type QueryTableProps = {
  index: number;
  namespace?: string;
};

type SeriesButtonProps = {
  index: number;
  labels: PrometheusLabels;
};
