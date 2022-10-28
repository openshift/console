import classNames from 'classnames';
import * as _ from 'lodash-es';
import {
  PrometheusData,
  PrometheusEndpoint,
  PrometheusLabels,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk';
import {
  ActionGroup,
  Button,
  Dropdown as PFDropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  KebabToggle,
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
  queryBrowserPatchQuery,
  queryBrowserRunQueries,
  queryBrowserSetAllExpanded,
  queryBrowserSetPollInterval,
  queryBrowserToggleIsEnabled,
  queryBrowserToggleSeries,
  toggleGraphs,
  queryBrowserAddQuery2,
  queryBrowserDeleteQuery2,
  queryBrowserDuplicateQuery2,
  queryBrowserToggleIsEnabled2,
  queryBrowserToggleSeries2,
  queryBrowserPatchQuery2,
  queryBrowserRunQueries2,
} from '../../actions/observe';
import { RootState } from '../../redux';
import { getPrometheusURL } from '../graphs/helpers';
import { AsyncComponent, getURLSearchParams, LoadingInline, usePoll, useSafeFetch } from '../utils';
import { setAllQueryArguments } from '../utils/router';
import { useBoolean } from './hooks/useBoolean';
import IntervalDropdown from './poll-interval-dropdown';
import { colors, Error, QueryBrowser } from './query-browser';
import TablePagination from './table-pagination';
import { PrometheusAPIError } from './types';

// Stores information about the currently focused query input
let focusedQuery;

const MetricsActionsMenu: React.FC<{}> = () => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);

  const isAllExpanded = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries']).every((q) => q.get('isExpanded')),
  );

  const dispatch = useDispatch();
  const addQuery = React.useCallback(() => dispatch(queryBrowserAddQuery()), [dispatch]);

  const doDelete = () => {
    dispatch(queryBrowserDeleteAllQueries());
    focusedQuery = undefined;
  };

  const dropdownItems = [
    <DropdownItem key="add-query" component="button" onClick={addQuery}>
      {t('public~Add query')}
    </DropdownItem>,
    <DropdownItem
      key="collapse-all"
      component="button"
      onClick={() => dispatch(queryBrowserSetAllExpanded(!isAllExpanded))}
    >
      {isAllExpanded ? t('public~Collapse all query tables') : t('public~Expand all query tables')}
    </DropdownItem>,
    <DropdownItem key="delete-all" component="button" onClick={doDelete}>
      {t('public~Delete all queries')}
    </DropdownItem>,
  ];

  return (
    <PFDropdown
      className="co-actions-menu"
      dropdownItems={dropdownItems}
      isOpen={isOpen}
      onSelect={setClosed}
      position={DropdownPosition.right}
      toggle={<DropdownToggle onToggle={setIsOpen}>Actions</DropdownToggle>}
    />
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

const ExpandButton = ({ isExpanded, onClick }) => {
  const { t } = useTranslation();
  const title = isExpanded ? t('public~Hide table') : t('public~Show table');
  console.log("JZ Expanded Button : " + isExpanded + " " + onClick)
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

// TODO: Resolve series:undefined -- in query-browser.tsx there is a dispatch(queryBrowswerPatch(i, series:<Prometheus_data>) that needs to be udpated)
const SeriesButton2: React.FC<SeriesButtonProps2> = ({ id, labels }) => {
  const { t } = useTranslation();

  const [colorIndex, isDisabled, isSeriesEmpty] = useSelector(({ observe }: RootState) => {
    const disabledSeries = observe.getIn(['queryBrowser2', 'queries2', id, 'disabledSeries']);
    if (_.some(disabledSeries, (s) => _.isEqual(s, labels))) {
      console.log("JZ isSeriesEmpty : " + false )
      return [null, true, false];
    }

    const series = observe.getIn(['queryBrowser2', 'queries2', id, 'series']);
    if (_.isEmpty(series)) {
      console.log("JZ isSeriesEmpty : " + true )
      return [null, false, true];
    }

    const colorOffset = observe
      .getIn(['queryBrowser2', 'queries2'])
      .take(id)
      .filter((q) => q.get('isEnabled'))
      .reduce((sum, q) => sum + _.size(q.get('series')), 0);
    const seriesIndex = _.findIndex(series, (s) => _.isEqual(s, labels));

    const cherries = observe
    .getIn(['queryBrowser2', 'queries2',id])
    .get('series')
    .reduce((sum, q) => sum + _.size(q), 0)

    console.log("JZ id %s", id)
    console.log("JZ cherries %s", JSON.stringify(cherries))

    console.log("JZ colorIndex is (colorOffset + seriesIndex) % colors.length : " + (colorOffset + seriesIndex) % colors.length)
    console.log("JZ colorOffSet %s, seriesIndex %s, colors %s , colors.length %s", colorOffset , seriesIndex, colors, colors.length)
    console.log("JZ Labels %s", JSON.stringify(labels))
    console.log("JZ series %s", JSON.stringify(series))

    return [(colorOffset + seriesIndex) % colors.length, false, false];
  });

  console.log("JZ colories %s", colors)
  console.log("JZ colorIndex %s", colorIndex)



  const dispatch = useDispatch();
  const toggleSeries = React.useCallback(() => dispatch(queryBrowserToggleSeries2(id, labels)), [
    dispatch,
    id,
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

// const SeriesButton: React.FC<SeriesButtonProps> = ({ index, labels }) => {
//   const { t } = useTranslation();

//   const [colorIndex, isDisabled, isSeriesEmpty] = useSelector(({ observe }: RootState) => {
//     const disabledSeries = observe.getIn(['queryBrowser', 'queries', index, 'disabledSeries']);
//     if (_.some(disabledSeries, (s) => _.isEqual(s, labels))) {
//       return [null, true, false];
//     }

//     const series = observe.getIn(['queryBrowser', 'queries', index, 'series']);
//     if (_.isEmpty(series)) {
//       return [null, false, true];
//     }

//     const colorOffset = observe
//       .getIn(['queryBrowser', 'queries'])
//       .take(index)
//       .filter((q) => q.get('isEnabled'))
//       .reduce((sum, q) => sum + _.size(q.get('series')), 0);
//     const seriesIndex = _.findIndex(series, (s) => _.isEqual(s, labels));
//     return [(colorOffset + seriesIndex) % colors.length, false, false];
//   });

//   const dispatch = useDispatch();
//   const toggleSeries = React.useCallback(() => dispatch(queryBrowserToggleSeries(index, labels)), [
//     dispatch,
//     index,
//     labels,
//   ]);

//   if (isSeriesEmpty) {
//     return <div className="query-browser__series-btn-wrap"></div>;
//   }
//   const title = isDisabled ? t('public~Show series') : t('public~Hide series');

//   return (
//     <div className="query-browser__series-btn-wrap">
//       <Button
//         aria-label={title}
//         className={classNames('query-browser__series-btn', {
//           'query-browser__series-btn--disabled': isDisabled,
//         })}
//         onClick={toggleSeries}
//         style={colorIndex === null ? undefined : { backgroundColor: colors[colorIndex] }}
//         title={title}
//         type="button"
//         variant="plain"
//       />
//     </div>
//   );
// };

const QueryKebab: React.FC<{ index: number }> = ({ index }) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);

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

  const dropdownItems = [
    <DropdownItem key="toggle-query" component="button" onClick={toggleIsEnabled}>
      {isEnabled ? t('public~Disable query') : t('public~Enable query')}
    </DropdownItem>,
    <DropdownItem key="toggle-all-series" component="button" onClick={toggleAllSeries}>
      {isDisabledSeriesEmpty ? t('public~Hide all series') : t('public~Show all series')}
    </DropdownItem>,
    <DropdownItem key="delete" component="button" onClick={doDelete}>
      {t('public~Delete query')}
    </DropdownItem>,
    <DropdownItem key="duplicate" component="button" onClick={doClone}>
      {t('public~Duplicate query')}
    </DropdownItem>,
  ];

  return (
    <PFDropdown
      data-test-id="kebab-button"
      dropdownItems={dropdownItems}
      isOpen={isOpen}
      isPlain
      onSelect={setClosed}
      position={DropdownPosition.right}
      toggle={<KebabToggle id="toggle-kebab" onToggle={setIsOpen} />}
    />
  );
};

const QueryKebab2: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);

  const isDisabledSeriesEmpty = useSelector(({ observe }: RootState) =>
    _.isEmpty(observe.getIn(['queryBrowser', 'queries', id, 'disabledSeries'])),
  );
  const isEnabled = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', id, 'isEnabled']),
  );
  const series = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser', 'queries', id, 'series']),
  );

  const dispatch = useDispatch();

  const toggleIsEnabled = React.useCallback(() => dispatch(queryBrowserToggleIsEnabled2(id)), [
    dispatch,
    id,
  ]);

  const toggleAllSeries = React.useCallback(
    () =>
      dispatch(
        queryBrowserPatchQuery2(id, {
          disabledSeries: isDisabledSeriesEmpty ? series : [],
        }),
      ),
    [dispatch, id, isDisabledSeriesEmpty, series],
  );

  const doDelete = React.useCallback(() => {
    dispatch(queryBrowserDeleteQuery2(id));
    focusedQuery = undefined;
  }, [dispatch, id]);

  const doClone = React.useCallback(() => {
    dispatch(queryBrowserDuplicateQuery2(id));
  }, [dispatch, id]);

  const dropdownItems = [
    <DropdownItem key="toggle-query" component="button" onClick={toggleIsEnabled}>
      {isEnabled ? t('public~Disable query') : t('public~Enable query')}
    </DropdownItem>,
    <DropdownItem key="toggle-all-series" component="button" onClick={toggleAllSeries}>
      {isDisabledSeriesEmpty ? t('public~Hide all series') : t('public~Show all series')}
    </DropdownItem>,
    <DropdownItem key="delete" component="button" onClick={doDelete}>
      {t('public~Delete query')}
    </DropdownItem>,
    <DropdownItem key="duplicate" component="button" onClick={doClone}>
      {t('public~Duplicate query')}
    </DropdownItem>,
  ];

  return (
    <PFDropdown
      data-test-id="kebab-button"
      dropdownItems={dropdownItems}
      isOpen={isOpen}
      isPlain
      onSelect={setClosed}
      position={DropdownPosition.right}
      toggle={<KebabToggle id="toggle-kebab" onToggle={setIsOpen} />}
    />
  );
};

export const QueryTable2: React.FC<QueryTableProps2> = ({ id, namespace }) => {
  const { t } = useTranslation();

  // Set all the Variables 
  const [data, setData] = React.useState<PrometheusData>();
  const [error, setError] = React.useState<PrometheusAPIError>();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(50);
  const [sortBy, setSortBy] = React.useState<ISortBy>({});

  const isEnabled = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id, 'isEnabled']),
  );
  const isExpanded = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id, 'isExpanded']),
  );
  // const pollInterval = useSelector(({ observe }: RootState) =>
  //   observe.getIn(['queryBrowser2', 'pollInterval'], 15 * 1000),
  // );
  const pollInterval = 15 * 1000

  const query = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id, 'query']),
  );
  const series = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id, 'series']),
  );
  const span = useSelector(({ observe }: RootState) => observe.getIn(['queryBrowser2', 'timespan']));

  const lastRequestTime = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'lastRequestTime']),
  );

  const safeFetch = React.useCallback(useSafeFetch(), []);

  // JZ if there's a query and the table row is send a request to Prometheus 
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

  console.log("JZ Prometheus data: " +  JSON.stringify(data))
  console.log("JZ PollInterval data: " +  JSON.stringify(pollInterval))



  // JZ save callback and poll the request at set time intervals 
  usePoll(tick, pollInterval, namespace, query, span, lastRequestTime);

  // JZ clear previous data? 
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

  console.log("JZ result %s", JSON.stringify(result))

  const transforms = [sortable, wrappable];

  // JZ LEFT OFF HERE Oct 19 5:30pm -- Query{...series:undefined} -- Prometheus data is not getting properly set 
  // Hacked this -- by queryBrowserPatchQuery

  const dispatch = useDispatch();
  dispatch(queryBrowserPatchQuery2(id, {series: data.result}))

  const buttonCell = (labels) => ({ title: <SeriesButton2 id={id} labels={labels} /> });

  console.log("JZ buttonCell %s", buttonCell)

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

    console.log("JZ Rows %s", rows)
    console.log("JZ columns %s", columns)
    console.log("JZ rowMapper %s", rowMapper)
    

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

const Query2 : React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation();

  // const q = useSelector(({ observe }: RootState) =>
  //   observe.getIn(['queryBrowser2', 'queries2']),
  // );

  // QueriesList {id:Map{}, id:Map{}, id:Map{}}
  const isEnabled = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id, 'isEnabled']),
  );
  const isExpanded = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id, 'isExpanded']),
  );
  const text = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id, 'text'], ''),
  );

  const queries = useSelector(({ observe }: RootState) =>
    observe.getIn(['queryBrowser2', 'queries2', id]),
  );

  console.log("QueryComponent : " + id + " " + queries.toString())

  const dispatch = useDispatch();

  const toggleIsEnabled = React.useCallback(() => dispatch(queryBrowserToggleIsEnabled2(id)), [
    dispatch,
    id,
  ]);

  const toggleIsExpanded = React.useCallback(
    () => dispatch(queryBrowserPatchQuery2(id, { isExpanded: !isExpanded })),
    [dispatch, id, isExpanded],
  );

  const handleTextChange = React.useCallback(
    (value: string) => {
      dispatch(queryBrowserPatchQuery2(id, { text: value }));
    },
    [dispatch, id],
  );

  const handleExecuteQueries = React.useCallback(() => {
    dispatch(queryBrowserRunQueries2());
  }, [dispatch]);

  // TODO: NOT sure if this actually is working ... 
  // when you click on a selection from the dropdown, the query runs with out 
  // clicking 'run query'
  const handleSelectionChange = (
    target: { focus: () => void; setSelectionRange: (start: number, end: number) => void },
    start: number,
    end: number,
  ) => {
    focusedQuery = { id, selection: { start, end }, target };
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
          <QueryKebab2 id={id} />
        </div>
        </div>

        <QueryTable2 id={id} />
      </div>
  );
  

}

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

  // TODO: DON'T Change the query-browser NOTE -- 10-20-11:08
  // Loop through the QueryMAP and match the query-string to get the Object ID 

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
  const addQuery2 = React.useCallback(() => dispatch(queryBrowserAddQuery2()), [dispatch]);

  return (
    // TODO: Update onClick so that its only one function that is called 
    <Button
      className="query-browser__inline-control"
      onClick={addQuery && addQuery2}
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
  const runQueries = React.useCallback(() => dispatch(queryBrowserRunQueries2()), [dispatch]);

  return (
    <Button onClick={runQueries} type="submit" variant="primary">
      {t('public~Run queries')}
    </Button>
  );
};


const QueriesList: React.FC<{}> = () => {

  const queries =  useSelector(
    ({ observe }: RootState) => observe.getIn(['queryBrowser', 'queries']),
  );

  const queries2 = useSelector(
    ({ observe }: RootState) => observe.getIn(['queryBrowser2', 'queries2']),
  );


  queries2.forEach((value, key) => {
    console.log("JZ Key:Value " + key +  " : " + value.toString());
  })

  // JZ NOTE: number ID APPROACH
  // const queryKeys = queries2.keySeq().sort().reverse()

  // TODO: Which is the better choice for ID: string or number?
  // number is easier to development 
  // string is easier for debugging 
  
  // JZ NOTE: string ID APPROACH 
  // comparator to sort IDs in reverse (newest queries precede older queries)
  // .slice() to seperate the ID number from the string "query-browser-query-id-123"
  const sortedQueries = queries2.sort((k1,k2) => {
    if (k1.get("sortOrder") < k2.get("sortOrder")) {
      return 1;
    }
    if (k1.get("sortOrder") > k2.get("sortOrder")) {
        return -1;
    }
    return 0;
   }
  )

  
  // State > Queries > Object structure is List[Map<string:string>]
  // TODO: QueriesList need to sort the map by ID then render 
  return (
    <>
      {/* TODO: Delete OUTPUT  */}
      <div>
        <div>
            QueriesList: {queries.toString()}
            <br/>
            QueriesList2: {queries2.toString()}
            <br/>
            <br/>
        </div>

      {/* JZ NOTE: Original Code    */}
      {/* {_.range(queries.size).map((i) => (
        <div>
          The Index is : {i}   key : {queries.get(i).get("id")} 
          <Query index={i} key={queries.get(i).get("id")} />
        </div>
      ))} */}

      {/* JZ NOTE: Changes  */}
      {
        sortedQueries.keySeq().map(key => 
          <div>
            {key}
            <Query2 id={key} key={key} />
          </div>
          )
      } 
      </div>
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
            <div className="query-browser__toggle-graph-container">
              <ToggleGraph />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <QueryBrowserWrapper />
            <div className="query-browser__controls">
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

// TODO: delete 
type QueryTableProps = {
  index: number;
  namespace?: string;
};

type QueryTableProps2 = {
  id: string;
  namespace?: string;
};

// TODO: Delete 
type SeriesButtonProps = {
  index: number;
  labels: PrometheusLabels;
};

type SeriesButtonProps2 = {
  id: string;
  labels: PrometheusLabels;
};