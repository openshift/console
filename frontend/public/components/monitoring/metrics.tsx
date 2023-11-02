import classNames from 'classnames';
import * as _ from 'lodash-es';
import {
  PrometheusData,
  PrometheusEndpoint,
  PrometheusLabels,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk';
import { Alert, Button } from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons/dist/esm/icons/chart-line-icon';
import { CompressIcon } from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import {
  ISortBy,
  sortable,
  TableGridBreakpoint,
  TableVariant,
  wrappable,
} from '@patternfly/react-table';
import {
  Table as TableDeprecated,
  TableHeader as TableHeaderDeprecated,
  TableBody as TableBodyDeprecated,
} from '@patternfly/react-table/deprecated';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import { queryBrowserTheme } from '@console/shared/src/components/query-browser';

import {
  queryBrowserToggleAllSeries,
  queryBrowserToggleSeries,
  toggleGraphs,
} from '../../actions/observe';
import { RootState } from '../../redux';
import { getPrometheusURL } from '../graphs/helpers';
import { LoadingInline, usePoll, useSafeFetch } from '../utils';
import TablePagination from './table-pagination';
import { PrometheusAPIError } from './types';

export const ToggleGraph: React.FC = () => {
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

const SeriesButton: React.FC<SeriesButtonProps> = ({ index, labels }) => {
  const { t } = useTranslation();

  const colors = queryBrowserTheme.line.colorScale;

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

  const dispatch = useDispatch();

  const toggleAllSeries = React.useCallback(() => dispatch(queryBrowserToggleAllSeries(index)), [
    dispatch,
    index,
  ]);

  const isDisabledSeriesEmpty = useSelector(({ observe }: RootState) =>
    _.isEmpty(observe.getIn(['queryBrowser', 'queries', index, 'disabledSeries'])),
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Alert
          className="co-alert"
          isInline
          title={t('public~Error loading values')}
          variant="danger"
        >
          {_.get(error, 'json.error', error.message)}
        </Alert>
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
          <Button
            variant="link"
            isInline
            onClick={toggleAllSeries}
            className="query-browser__series-select-all-btn"
          >
            {isDisabledSeriesEmpty ? t('public~Unselect all') : t('public~Select all')}
          </Button>
          <TableDeprecated
            aria-label={t('public~query results table')}
            cells={columns}
            gridBreakPoint={TableGridBreakpoint.none}
            onSort={onSort}
            rows={tableRows}
            sortBy={sortBy}
            variant={TableVariant.compact}
          >
            <TableHeaderDeprecated />
            <TableBodyDeprecated />
          </TableDeprecated>
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

type QueryTableProps = {
  index: number;
  namespace?: string;
};

type SeriesButtonProps = {
  index: number;
  labels: PrometheusLabels;
};
