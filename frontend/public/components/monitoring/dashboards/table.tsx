import * as _ from 'lodash-es';
import * as React from 'react';
import {
  ISortBy,
  sortable,
  Table as PFTable,
  TableBody,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table';

import ErrorAlert from '@console/shared/src/components/alerts/error';

import { ColumnStyle, Panel } from './types';
import { PrometheusResponse } from '../../graphs';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import {
  formatToFractionalDigits,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  humanizePacketsPerSec,
  usePoll,
  useSafeFetch,
} from '../../utils';
import { TablePagination } from '../metrics';

const formatNumber = (value: number, decimals: number, unit: string): string => {
  if (_.isNil(value) || isNaN(value)) {
    return '-';
  }

  switch (unit) {
    case 'short':
      return formatToFractionalDigits(value, decimals);
    case 'percentunit':
      return Intl.NumberFormat(undefined, {
        style: 'percent',
        maximumFractionDigits: decimals,
      }).format(value);
    case 'bytes':
      return humanizeBinaryBytes(value).string;
    case 'Bps':
      return humanizeDecimalBytesPerSec(value).string;
    case 'pps':
      return humanizePacketsPerSec(value).string;
    default:
      return `${formatToFractionalDigits(value, decimals)} ${unit}`;
  }
};

const paginationOptions = [5, 10, 20, 50, 100].map((n) => ({
  title: n.toString(),
  value: n,
}));

const Table: React.FC<Props> = ({ panel, pollInterval, queries }) => {
  const [error, setError] = React.useState();
  const [isLoading, setLoading] = React.useState(true);
  const [data, setData] = React.useState();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(5);
  const [sortBy, setSortBy] = React.useState<ISortBy>({ index: 0, direction: 'asc' });
  const onSort = (e, i, direction) => setSortBy({ index: i, direction });
  const safeFetch = React.useCallback(useSafeFetch(), []);

  const tick = () => {
    Promise.all(
      queries.map((q) =>
        safeFetch(getPrometheusURL({ endpoint: PrometheusEndpoint.QUERY, query: q })),
      ),
    )
      .then((responses: PrometheusResponse[]) => {
        setError(undefined);
        setLoading(false);
        // FIXME: This makes the following assumptions about the data:
        // 1. The transform is `table`
        // 2. The results will only have one label, and it is present in all query responses.
        // 3. The value will be an instance vector (single value).
        // 4. The time column is hidden.
        // The Grafana implementation is much more involved. See
        //   https://grafana.com/docs/grafana/latest/features/panels/table_panel/#merge-multiple-queries-per-table
        setData(
          responses.reduce((acc, response, i: number) => {
            response.data.result.forEach(({ metric, value }) => {
              const label = _.first(Object.keys(metric));
              const tag = metric[label];
              // Fill in the array with undefined values and set each value by index. This makes
              // sure the columns are correct if one of the ealier responses didn't include this
              // tag.
              if (!acc[tag]) {
                acc[tag] = [tag, ...Array.from({ length: responses.length }, () => undefined)];
              }
              acc[tag][i + 1] = [value[1] || ''];
            });
            return acc;
          }, {} as any),
        );
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(_.get(err, 'json.error', err.message));
          setLoading(false);
          setData(undefined);
        }
      });
  };

  usePoll(tick, pollInterval, queries);
  if (isLoading) {
    return <div className="loading-skeleton--table" />;
  }
  if (error) {
    return <ErrorAlert message={error} />;
  }
  // FIXME: It's a little unclear how to associate a column style with the data. This assumes the
  // styles are in the same order as the queries with the time column at the head of the array and
  // additional columns at the end.
  const labelStyle: ColumnStyle = panel.styles[queries.length + 1];
  const columns: ColumnStyle[] = [labelStyle, ...panel.styles.slice(1, -2)];
  const sortAsNumber = columns[sortBy.index].type === 'number';
  const sort = (row: string[]) => {
    const val = row[sortBy.index];
    if (!sortAsNumber) {
      return val;
    }
    if (_.isNil(val)) {
      return Number.MIN_VALUE;
    }
    const num = Number(val);
    // Some columns styles claim to be numbers, but have string data. Still sort those as strings.
    return _.isFinite(num) ? num : val;
  };
  const sortedData = _.orderBy(data, [sort], [sortBy.direction]);
  const formattedRows: string[][] = _.map(sortedData, (values: string[]) => {
    return values.map((value: string, i: number) => {
      const { type, decimals = 2, unit = '' } = panel.styles[i];
      switch (type) {
        case 'number':
          return formatNumber(Number(value), decimals, unit);
        default:
          return value || '-';
      }
    });
  });
  const cells = columns.map(({ alias: title }) => ({
    title,
    transforms: [sortable],
  }));
  const paginatedRows: string[][] = formattedRows.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <div className="monitoring-dashboards__table-container">
        <PFTable
          aria-label="query results table"
          cells={cells}
          onSort={onSort}
          rows={paginatedRows}
          sortBy={sortBy}
          variant={TableVariant.compact}
          className="monitoring-dashboards__table"
        >
          <TableHeader />
          <TableBody />
        </PFTable>
      </div>
      <TablePagination
        itemCount={formattedRows.length}
        paginationOptions={paginationOptions}
        page={page}
        perPage={perPage}
        setPage={setPage}
        setPerPage={setPerPage}
      />
    </>
  );
};

type Props = {
  panel: Panel;
  pollInterval: number;
  queries: string[];
};

export default Table;
