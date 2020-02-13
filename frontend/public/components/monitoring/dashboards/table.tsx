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

import { formatNumber } from './format';
import { ColumnStyle, Panel } from './types';
import { PrometheusResponse } from '../../graphs';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { EmptyBox, usePoll, useSafeFetch } from '../../utils';
import { TablePagination } from '../metrics';

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
            const id = panel.targets[i].refId;
            response.data.result.forEach(({ metric, value }) => {
              const label = _.first(Object.keys(metric));
              const tag = metric[label];
              if (!acc[tag]) {
                acc[tag] = { ...metric };
              }
              acc[tag][`Value #${id}`] = value[1] || '';
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
  if (_.isEmpty(data)) {
    return <EmptyBox label="Data" />;
  }

  // Make a copy of the array and move the first label to the front.
  // FIXME: Remove magic number for label index.
  const styles = [...panel.styles];
  const labelIndex = queries.length + 1;
  styles.unshift(styles.splice(labelIndex, 1)[0]);

  // Remove hidden and regex columns.
  const columns: ColumnStyle[] = styles.filter(
    ({ type, pattern, alias }) => type !== 'hidden' && !pattern.startsWith('/') && alias,
  );

  // Sort the data.
  const sort = (row) => {
    const { pattern, type } = columns[sortBy.index];
    const val = row[pattern];
    if (type !== 'number') {
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

  // Format the table rows.
  const formattedRows: string[][] = sortedData.map((values: { [key: string]: string }) => {
    return columns.reduce((acc, { type, decimals = 2, pattern, unit = '' }) => {
      const value = values[pattern];
      switch (type) {
        case 'number':
          acc.push(formatNumber(value, decimals, unit));
          break;
        default:
          acc.push(value || '-');
      }
      return acc;
    }, []);
  });

  const headers = columns.map(({ alias: title }) => ({
    title,
    transforms: [sortable],
  }));
  const paginatedRows: string[][] = formattedRows.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <div className="monitoring-dashboards__table-container">
        <PFTable
          aria-label="query results table"
          cells={headers}
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
